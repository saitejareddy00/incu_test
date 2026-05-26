# Salary Management System

A full-stack HR salary management application for browsing, managing, and analysing employee salary data — built to handle an organisation of 10,000+ employees.

**Stack:** Node.js · Express · TypeScript · PostgreSQL 16 · raw `pg` (no ORM) · Vite · React 18 · MUI v5 · TanStack Query · Vitest

---

## Demo
[watch the demo here](https://drive.google.com/file/d/1ogMKhiYEImlZkfSSjl9pQQ_DvOP-RFLj/view?usp=sharing)

## Table of contents

- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [API summary](#api-summary)
- [Running tests](#running-tests)
- [Seeding](#seeding)
- [Environment variables](#environment-variables)
- [Architecture notes](#architecture-notes)
- [Trade-offs and out of scope](#trade-offs-and-out-of-scope)
- [Further documentation](#further-documentation)

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose v2+
- [Node.js](https://nodejs.org/) 20 LTS or newer
- npm 10+

---

## Quick start

```bash
# 1. Start PostgreSQL (also creates the app_test database via docker/init-db.sql)
docker compose up -d

# 2. Install dependencies
(cd backend  && npm install)
(cd frontend && npm install)

# 3. Configure backend environment
cp backend/.env.example backend/.env

# 4. Apply database migrations to the dev database
(cd backend && npm run migrate)

# 5. (Optional) Seed 10,000 employees
(cd backend && npm run seed -- --truncate)

# 6. Start the backend (port 3000)
(cd backend && npm run dev)

# 7. In a second terminal, start the frontend (port 5173)
(cd frontend && npm run dev)
```

Open <http://localhost:5173>. The HR Manager dashboard, employees list, and insights views should all be wired up against the API at <http://localhost:3000/api>.

> The Vitest global setup migrates the `app_test` database automatically before integration tests — you do **not** need to run `npm run migrate` against the test DB manually.

### Makefile shortcuts

A root-level [`Makefile`](Makefile) wraps the most common workflows. Run `make` (or `make help`) for the full list. Most useful targets:

```bash
make install   # backend + frontend dependencies
make db-up     # start PostgreSQL
make migrate   # apply migrations to the dev DB
make seed      # truncate + seed 10,000 employees
make dev       # backend + frontend concurrently (Ctrl-C stops both)
make test      # backend tests, then frontend tests
make build     # production build for both
```

The `Makefile` is a thin convenience layer — every target is just one or two `npm` invocations. On Windows, use WSL or run the underlying `npm` scripts in `backend/` and `frontend/` directly.

---

## Project structure

```
.
├── backend/
│   ├── src/
│   │   ├── app/              Express app, error handler
│   │   ├── config/           Zod-validated env loader
│   │   ├── db/               pg Pool, migration runner, SQL migrations
│   │   ├── employees/        CRUD: schemas, repository, service, router
│   │   ├── insights/         Aggregates: repository, service, router
│   │   ├── seed/             Bulk seed pipeline (PRNG, generators, COPY)
│   │   └── test/             Test helpers (per-test transaction wrapper)
│   ├── data/                 first_names.txt, last_names.txt
│   └── docs/                 seed.md, query-plans.md, performance.md
├── frontend/
│   └── src/
│       ├── api/              Typed client + TanStack Query hooks
│       ├── components/       DataTable, FormDialog, ConfirmDialog, KpiCard
│       ├── features/         Employee form, filters, etc.
│       ├── layout/           AppShell with sidebar nav
│       ├── notifications/    Global toast/error context
│       └── pages/            Dashboard, Employees, EmployeeDetail, Insights
├── docker/                   Postgres init script (creates app_test DB)
├── docker-compose.yml
├── board.md                  Full epic / story breakdown with statuses
└── README.md
```

---

## API summary

All endpoints are mounted under `/api`. JSON in, JSON out. Validation errors return `400` with a structured body.

| Method | Path                                                       | Description                                            |
|--------|------------------------------------------------------------|--------------------------------------------------------|
| GET    | `/api/employees`                                           | Paginated list. Query: `page`, `pageSize`, `country`, `jobTitle`, `q`, `sort` |
| POST   | `/api/employees`                                           | Create employee                                        |
| GET    | `/api/employees/:id`                                       | Fetch one employee                                     |
| PATCH  | `/api/employees/:id`                                       | Partial update                                         |
| DELETE | `/api/employees/:id`                                       | Soft-delete (sets `deleted_at`)                        |
| GET    | `/api/insights/country/:country`                           | `{ min, max, avg, median, count }` in salary cents     |
| GET    | `/api/insights/country/:country/job-title/:jobTitle`       | `{ avg, count }` for a country + role combination      |
| GET    | `/api/insights/overview`                                   | Top countries / job titles by avg, headcount by dept   |
| GET    | `/health`                                                  | Liveness probe                                         |

---

## Running tests

```bash
(cd backend  && npm test)   # Vitest: unit + integration (real Postgres app_test DB)
(cd frontend && npm test)   # Vitest + React Testing Library + MSW
```

**Testing strategy:**

- **Unit tests** for pure logic — Zod schemas, query builders, PRNG, data generators, formatters. Zero I/O, millisecond-fast.
- **Integration tests** against a real PostgreSQL `app_test` database. Each test runs inside `BEGIN ... ROLLBACK` via the [`withTestDb`](backend/src/test/helpers/db.ts) helper, so tests are isolated, parallelisable, and leave no state behind. Migrations are applied **once** before the suite via Vitest global setup.
- **HTTP tests** via `supertest` against the actual Express app instance, hitting the test database.
- **Frontend tests** use React Testing Library with MSW to mock the API surface — behaviour-level assertions, not implementation-level.

---

## Seeding

```bash
cd backend
npm run seed                              # 10 000 rows, seed=42 (default)
npm run seed -- --truncate                # clear first, then insert 10 000
npm run seed -- --count 100000 --seed 7   # reproducible 100k-row dataset
```

Uses PostgreSQL `COPY ... FROM STDIN` via [`pg-copy-streams`](https://github.com/brianc/node-pg-copy-streams) — 10 000 rows in under a second on a laptop. The PRNG ([Mulberry32](https://gist.github.com/tommyettinger/46a874533244883189143505d203312c)) makes every run with the same `--seed` byte-for-byte reproducible. See [`backend/docs/seed.md`](backend/docs/seed.md) for the full CLI reference and recorded performance numbers.

---

## Environment variables

Copy [`backend/.env.example`](backend/.env.example) to `backend/.env`. Defaults match `docker-compose.yml`.

| Variable              | Default                                              | Description              |
|-----------------------|------------------------------------------------------|--------------------------|
| `DATABASE_URL`        | `postgres://app:app@localhost:5434/app`              | Main application DB      |
| `TEST_DATABASE_URL`   | `postgres://app:app@localhost:5434/app_test`         | Integration-test DB      |
| `PORT`                | `3000`                                               | HTTP server port         |
| `LOG_LEVEL`           | `info`                                               | Pino log level           |

> Postgres is exposed on host port **5434** (not 5432) to avoid clashes with any pre-existing local Postgres instance. The container itself still listens on 5432 internally.

---

## Architecture notes

- **Single `employees` table.** Salary stored as `bigint` cents (no float precision issues). `full_name` is a generated stored column. Soft-delete via nullable `deleted_at`.
- **No ORM.** All persistence is parameterised SQL through a shared [`pg.Pool`](backend/src/db/pool.ts) — transparent, fully indexable, and the seed pipeline can drop straight into `COPY` for bulk inserts.
- **Plain `.sql` migrations** tracked via a `schema_migrations` table. See [`backend/src/db/migrate.ts`](backend/src/db/migrate.ts) — small enough to read in one sitting.
- **Indexes** on `(country)`, `(country, job_title)`, `(job_title)`, plus a `pg_trgm` GIN index on `full_name` for free-text search. All aggregate queries complete in under 10 ms at 10k rows — see [`backend/docs/query-plans.md`](backend/docs/query-plans.md).
- **Frontend** uses TanStack Query as the single source of truth for server state, with URL query params driving list filters/pagination so links are shareable.

---

## Trade-offs and out of scope

To keep the assessment focused, the following are intentionally **not** in scope. See [`backend/docs/performance.md`](backend/docs/performance.md) for a fuller discussion of next steps.

- **No authentication.** The HR Manager is the only persona; the app assumes a trusted environment. Production would add JWT/session auth plus RBAC.
- **No caching layer.** Insight queries hit Postgres on every request. Sub-10 ms at 10k rows; Redis would be worth it at 100k+ or under heavy read load.
- **No API rate limiting.**
- **No background job queue.** Soft-deleted rows are never purged.
- **Offset-based pagination.** Fine for HR-scale browsing; would migrate to cursor-based for very deep paging.
- **Single-table data model.** No separate `countries`, `job_titles`, or `departments` tables yet — denormalised for query simplicity at this scale.

---

## Further documentation

- [`board.md`](board.md) — full epic / story breakdown with acceptance criteria and statuses.
- [`backend/docs/seed.md`](backend/docs/seed.md) — seed script CLI reference and performance.
- [`backend/docs/query-plans.md`](backend/docs/query-plans.md) — `EXPLAIN ANALYZE` output for every aggregate query.
- [`backend/docs/performance.md`](backend/docs/performance.md) — performance characteristics, known limitations, and productionisation roadmap.
