# Performance & Known Limitations

A snapshot of how the Salary Management backend performs at the target scale of **10,000 employees**, the design choices behind those numbers, and what would change at larger scale or for production hardening.

> Companion documents: [`query-plans.md`](query-plans.md) for raw `EXPLAIN ANALYZE` output, [`seed.md`](seed.md) for seed CLI and benchmarks.

---

## Summary

| Metric                                            | Measurement    | Notes                                     |
| ------------------------------------------------- | -------------- | ----------------------------------------- |
| Seed throughput                                   | ~20 000 rows/s | 10k rows in ≈ 0.5 s via `COPY FROM STDIN` |
| `listEmployees` — country + job title filter      | 0.26 ms        | Composite index, index-only path          |
| `listEmployees` — single-column filter            | 0.76–0.80 ms   | Bitmap heap scan                          |
| `listEmployees` — full-name `ILIKE` search        | 3.0 ms         | Trigram GIN index on `full_name`          |
| `getCountryStats` (min/max/avg/median/count)      | 0.58 ms        | Aggregates over filtered set              |
| `getCountryJobStats` (avg, count)                 | 0.20 ms        | Composite index, index scan               |
| `getOverviewMetrics` (single CTE, full dashboard) | 7.4 ms         | One `Bitmap Heap Scan`, four CTE passes   |

**Every query stays well under the 100 ms target at 10k rows.**

---

## Query strategy

### Indexes on `employees`

| Index                                                | Purpose                                                   |
| ---------------------------------------------------- | --------------------------------------------------------- |
| `employees_pkey` (id)                                | Primary key, lookups by id                                |
| `employees_email_key` (email)                        | Unique constraint, conflict detection on create/update    |
| `employees_active_idx (id) WHERE deleted_at IS NULL` | Cheap "active rows" filter — used by virtually every read |
| `idx_employees_country`                              | Filter by country                                         |
| `idx_employees_job_title`                            | Filter by job title                                       |
| `idx_employees_country_job_title`                    | Composite — covers the two hottest filter combos          |
| `idx_employees_full_name_trgm` (gin)                 | `pg_trgm` GIN for substring/`ILIKE` search                |

### Design rationale

- **Composite `(country, job_title)`** is the single most valuable index for this product. Every list view that drills from a country into a job title, and every per-country-and-role insight query, uses it as a primary access path. PostgreSQL also uses it as a leading-column-only `(country)` index, so we get two for the price of one.
- **Partial index on `deleted_at IS NULL`** keeps the working set narrow. Even at 10× scale, the active set is the only thing that matters for HR reads — soft-deleted rows are essentially dead weight at query time.
- **Trigram GIN on `full_name`** powers free-text employee search. At 10k rows the planner sometimes prefers a bitmap heap scan when the search is non-selective (e.g. `%First1%` matches 11 % of rows); this is the correct call. The GIN index kicks in for selective patterns.

See [`query-plans.md`](query-plans.md) for the full `EXPLAIN ANALYZE` output of every aggregate and list query.

### A note on planner statistics

After a fresh bulk seed, PostgreSQL row estimates can be off until statistics are refreshed. The seed script runs **`ANALYZE employees`** by default after insert (skip with `--no-analyze`). This sharpens the planner's decisions and matters more as the dataset grows.

---

## Seed throughput

The seed pipeline is built around **PostgreSQL `COPY ... FROM STDIN`** via [`pg-copy-streams`](https://github.com/brianc/node-pg-copy-streams). Three properties that matter:

1. **10–20× faster than batched `INSERT`** for the same row count, because `COPY` bypasses the SQL parser and plan cache and transfers a raw CSV byte stream.
2. **Constant memory** — rows are generated on demand and piped straight into the COPY stream. Peak heap is `O(batchSize)` regardless of `--count`, so a 1 000 000-row seed runs in the same memory footprint as a 10 000-row seed.
3. **Deterministic output** — the Mulberry32 PRNG is seedable with a single 32-bit integer, so every `--seed N` run produces byte-for-byte identical rows.

Recorded numbers on a MacBook Pro M2 (PostgreSQL 16 in Docker, `--batch-size=1000`):

| Rows    | Wall time | Throughput              |
| ------- | --------- | ----------------------- |
| 10 000  | ~0.5 s    | ~20 000 rows/sec        |
| 100 000 | ~3–4 s    | ~25 000–33 000 rows/sec |

Full CLI reference and methodology in [`seed.md`](seed.md).

---

## Pagination strategy

The list endpoint uses **classical offset/limit pagination** (`page`, `pageSize` query params; `pageSize` capped at 100, default 20). Total count is computed via a `count(*)` over the same filter predicate.

**Why offset for now:**

- HR managers browse small page ranges and use filters/search rather than deep paging.
- The combined cost of `count(*)` + `LIMIT/OFFSET` over the active partial-index is < 1 ms at 10k rows.
- Stable, intuitive URLs: `?page=3&pageSize=20` is shareable and bookmarkable.

**Where offset breaks down:**

- Offset is `O(offset + limit)`: at `offset = 50 000` Postgres still has to scan and discard the first 50k rows.
- `count(*)` is `O(N)` on the filtered set; it scales with the dataset.

**Mitigation already in place:**

- `pageSize` is capped at 100 so a single page is always cheap.
- The composite indexes make even moderate offsets affordable up to ~100k rows.

**Planned migration path (next-up work):**

- Cursor-based pagination keyed on `(full_name, id)` or `(created_at, id)` for the list endpoint. Offset variant stays as a fallback for shallow paging.
- Switch the `count(*)` to an approximate estimate (`reltuples` or a sampled count) for unfiltered totals at large scale.

---

## Known limitations

These are intentional MVP simplifications, not oversights. Each has a clear next step (see below).

- **No authentication.** Single HR Manager persona; the API trusts every caller. There is no users table, no session/JWT layer, no RBAC.
- **No caching layer.** Insight endpoints recompute on every call. At 10k rows this is sub-10 ms in Postgres, so cache amortisation is negative; at 100k+ or under heavy read load, Redis (or `pg`-side materialized views) would be worth it.
- **No API rate limiting.** Trivial to add at the Express layer (`express-rate-limit`).
- **No background job queue.** Soft-deleted rows are never purged. There is no scheduled `ANALYZE`, no scheduled re-aggregation, no async work of any kind.
- **Single-table denormalised model.** `country`, `job_title`, and `department` are stored as free-text strings on `employees`. No separate lookup tables, no foreign keys, no enforced enum set. This trades referential integrity for query simplicity at MVP scale.
- **Offset pagination.** As discussed above; fine for HR scale, will need cursor-based for very deep paging.
- **No request-level idempotency.** Repeating a `POST /employees` with the same payload creates duplicates if the email is changed each time. Acceptable for a UI-driven app; would need idempotency keys for a public API.
- **No structured audit log.** Updates and deletes silently overwrite/flag rows; we don't capture who changed what, when, or why.
- **No API versioning.** All endpoints live under `/api`, not `/api/v1`. Breaking changes would have to be coordinated.

---

## Productionisation next steps

In rough priority order for moving from "assessment-ready" to "production-ready":

1. **Authentication + RBAC.** JWT (or session cookies behind a reverse proxy), a `users` table, and role checks on every route. The HR Manager today, finance + IT roles tomorrow.
2. **Audit log.** A separate `employee_audit` append-only table capturing `actor_id`, `action`, `before`, `after`, `at`. Backed by a Postgres trigger so it can't be bypassed.
3. **Scheduled `ANALYZE` and soft-delete purge.** A simple cron (or `pg_cron`) job: `ANALYZE employees;` after every bulk write, plus a quarterly purge of rows soft-deleted longer than the retention policy.
4. **Cursor-based pagination** on the list endpoint, keyed on `(full_name, id)`. Keep offset/limit as a fallback.
5. **Redis cache** for `/insights/overview` (the most expensive endpoint) with a 30–60 s TTL and explicit invalidation on writes.
6. **Read replica** for analytics. The dashboard CTE is the only multi-segment scan in the system — sending it to a follower keeps the primary tight on transactional writes.
7. **CI pipeline.** GitHub Actions matrix: lint + type-check + backend tests (against a real Postgres service container) + frontend tests + build, on every PR.
8. **Observability.** OpenTelemetry traces, Pino logs to Loki or ELK, RED-method dashboards (request rate, error rate, duration) per endpoint.
9. **API rate limiting + request-size limits + CORS allowlist.** Standard hardening at the Express layer.
10. **API versioning** (`/api/v1/...`) before the first external consumer ships.
11. **Schema normalisation when justified.** Move `country`, `job_title`, `department` into lookup tables once the product needs constraints, translations, or editor UI for them.
