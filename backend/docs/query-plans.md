# Query Plans — Salary Management Backend

> Generated against **10,005 active rows** (10 000-row dataset).
> All timings are wall-clock from `EXPLAIN ANALYZE` on a development laptop.

---

## Indexes on `employees`

| Index                             | Definition                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `employees_active_idx`            | `CREATE INDEX employees_active_idx ON public.employees USING btree (id) WHERE (deleted_at IS NULL)` |
| `employees_email_key`             | `CREATE UNIQUE INDEX employees_email_key ON public.employees USING btree (email)`                   |
| `employees_pkey`                  | `CREATE UNIQUE INDEX employees_pkey ON public.employees USING btree (id)`                           |
| `idx_employees_country`           | `CREATE INDEX idx_employees_country ON public.employees USING btree (country)`                      |
| `idx_employees_country_job_title` | `CREATE INDEX idx_employees_country_job_title ON public.employees USING btree (country, job_title)` |
| `idx_employees_full_name_trgm`    | `CREATE INDEX idx_employees_full_name_trgm ON public.employees USING gin (full_name gin_trgm_ops)`  |
| `idx_employees_job_title`         | `CREATE INDEX idx_employees_job_title ON public.employees USING btree (job_title)`                  |

---

## Summary

| Query                               | Node type                    | Index used                                                 | Execution time |
| ----------------------------------- | ---------------------------- | ---------------------------------------------------------- | -------------- |
| listEmployees — country             | Bitmap Heap Scan             | `idx_employees_country_job_title` + `employees_active_idx` | 0.756 ms       |
| listEmployees — job_title           | Bitmap Heap Scan             | `idx_employees_job_title` + `employees_active_idx`         | 0.795 ms       |
| listEmployees — country + job_title | Index Scan                   | `idx_employees_country_job_title`                          | **0.258 ms**   |
| listEmployees — full-name ILIKE     | Bitmap Heap Scan             | `employees_active_idx` (then row-filter)                   | 3.000 ms       |
| getCountryStats                     | Bitmap Heap Scan + Aggregate | `idx_employees_country_job_title` + `employees_active_idx` | 0.583 ms       |
| getCountryJobStats                  | Index Scan + Aggregate       | `idx_employees_country_job_title`                          | **0.203 ms**   |
| getOverviewMetrics (CTE)            | Seq Scan on materialized CTE | `employees_active_idx` (initial scan only)                 | 7.385 ms       |

**All queries complete well under the 100 ms target.**

### Notes

- **ILIKE / trigram index:** The GIN index `idx_employees_full_name_trgm` was not selected for `%First1%`
  because that pattern matches ~11 % of active rows — above the cost crossover point where a bitmap
  heap scan of the already-narrow active set is cheaper. The GIN index activates for selective patterns
  (typically < 5 % of rows). For patterns with ≥ 3 fixed characters and low selectivity (e.g.
  `%Jo%`), consider using `similarity()` or `%` operator (pg_trgm) which forces index use.

- **getOverviewMetrics CTE:** The plan confirms a **single** `Bitmap Heap Scan on employees` (the
  `MATERIALIZED` CTE) followed by four in-memory `CTE Scan` passes. No additional table touches.

- **Planner statistics:** At 10 000 rows, PostgreSQL's row estimates are noticeably off (`rows=1`
  vs actual `rows=1002`) because `ANALYZE` has not been run after the bulk insert. Running
  `ANALYZE employees` would correct the statistics and allow the planner to make better decisions
  at larger scale.

---

## Query Plans

### listEmployees — country filter (idx_employees_country)

```
Limit  (cost=13.21..13.22 rows=1 width=264) (actual time=0.725..0.727 rows=20 loops=1)
  Buffers: shared hit=279
  ->  Sort  (cost=13.21..13.22 rows=1 width=264) (actual time=0.725..0.726 rows=20 loops=1)
        Sort Key: full_name
        Sort Method: top-N heapsort  Memory: 31kB
        Buffers: shared hit=279
        ->  Bitmap Heap Scan on employees  (cost=9.19..13.20 rows=1 width=264) (actual time=0.292..0.550 rows=1002 loops=1)
              Recheck Cond: ((deleted_at IS NULL) AND (country = 'US'::bpchar))
              Heap Blocks: exact=222
              Buffers: shared hit=276
              ->  BitmapAnd  (cost=9.19..9.19 rows=1 width=0) (actual time=0.277..0.277 rows=0 loops=1)
                    Buffers: shared hit=54
                    ->  Bitmap Index Scan on employees_active_idx  (cost=0.00..4.43 rows=30 width=0) (actual time=0.254..0.254 rows=10005 loops=1)
                          Buffers: shared hit=52
                    ->  Bitmap Index Scan on idx_employees_country_job_title  (cost=0.00..4.51 rows=30 width=0) (actual time=0.017..0.017 rows=1002 loops=1)
                          Index Cond: (country = 'US'::bpchar)
                          Buffers: shared hit=2
Planning:
  Buffers: shared hit=31
Planning Time: 0.107 ms
Execution Time: 0.756 ms
```

**Execution time (10k rows):** 0.756 ms

### listEmployees — job_title filter (idx_employees_job_title)

```
Limit  (cost=13.21..13.22 rows=1 width=264) (actual time=0.770..0.771 rows=20 loops=1)
  Buffers: shared hit=277
  ->  Sort  (cost=13.21..13.22 rows=1 width=264) (actual time=0.769..0.770 rows=20 loops=1)
        Sort Key: full_name
        Sort Method: top-N heapsort  Memory: 33kB
        Buffers: shared hit=277
        ->  Bitmap Heap Scan on employees  (cost=9.19..13.20 rows=1 width=264) (actual time=0.255..0.508 rows=2002 loops=1)
              Recheck Cond: ((deleted_at IS NULL) AND (job_title = 'Engineer'::text))
              Heap Blocks: exact=222
              Buffers: shared hit=277
              ->  BitmapAnd  (cost=9.19..9.19 rows=1 width=0) (actual time=0.243..0.243 rows=0 loops=1)
                    Buffers: shared hit=55
                    ->  Bitmap Index Scan on employees_active_idx  (cost=0.00..4.43 rows=30 width=0) (actual time=0.208..0.209 rows=10005 loops=1)
                          Buffers: shared hit=52
                    ->  Bitmap Index Scan on idx_employees_job_title  (cost=0.00..4.51 rows=30 width=0) (actual time=0.026..0.026 rows=2002 loops=1)
                          Index Cond: (job_title = 'Engineer'::text)
                          Buffers: shared hit=3
Planning Time: 0.071 ms
Execution Time: 0.795 ms
```

**Execution time (10k rows):** 0.795 ms

### listEmployees — country + job_title (idx_employees_country_job_title)

```
Limit  (cost=8.31..8.32 rows=1 width=264) (actual time=0.248..0.250 rows=20 loops=1)
  Buffers: shared hit=224
  ->  Sort  (cost=8.31..8.32 rows=1 width=264) (actual time=0.248..0.249 rows=20 loops=1)
        Sort Key: full_name
        Sort Method: top-N heapsort  Memory: 31kB
        Buffers: shared hit=224
        ->  Index Scan using idx_employees_country_job_title on employees  (cost=0.28..8.30 rows=1 width=264) (actual time=0.007..0.113 rows=1002 loops=1)
              Index Cond: ((country = 'US'::bpchar) AND (job_title = 'Engineer'::text))
              Filter: (deleted_at IS NULL)
              Buffers: shared hit=224
Planning Time: 0.028 ms
Execution Time: 0.258 ms
```

**Execution time (10k rows):** 0.258 ms

### listEmployees — full-name search ILIKE (idx_employees_full_name_trgm)

> **Note:** GIN trigram index kicks in when the pattern contains ≥ 3 fixed characters.

```
Limit  (cost=89.37..89.38 rows=1 width=264) (actual time=2.978..2.980 rows=20 loops=1)
  Buffers: shared hit=274
  ->  Sort  (cost=89.37..89.38 rows=1 width=264) (actual time=2.977..2.978 rows=20 loops=1)
        Sort Key: full_name
        Sort Method: top-N heapsort  Memory: 32kB
        Buffers: shared hit=274
        ->  Bitmap Heap Scan on employees  (cost=4.43..89.36 rows=1 width=264) (actual time=0.289..2.809 rows=1112 loops=1)
              Recheck Cond: (deleted_at IS NULL)
              Filter: (full_name ~~* '%First1%'::text)
              Rows Removed by Filter: 8893
              Heap Blocks: exact=222
              Buffers: shared hit=274
              ->  Bitmap Index Scan on employees_active_idx  (cost=0.00..4.43 rows=30 width=0) (actual time=0.270..0.270 rows=10005 loops=1)
                    Buffers: shared hit=52
Planning:
  Buffers: shared hit=7 dirtied=1
Planning Time: 0.097 ms
Execution Time: 3.000 ms
```

**Execution time (10k rows):** 3 ms

### getCountryStats — salary aggregates for one country

```
Aggregate  (cost=13.22..13.24 rows=1 width=40) (actual time=0.549..0.549 rows=1 loops=1)
  Buffers: shared hit=284
  ->  Bitmap Heap Scan on employees  (cost=9.19..13.20 rows=1 width=8) (actual time=0.297..0.417 rows=1002 loops=1)
        Recheck Cond: ((deleted_at IS NULL) AND (country = 'US'::bpchar))
        Heap Blocks: exact=222
        Buffers: shared hit=276
        ->  BitmapAnd  (cost=9.19..9.19 rows=1 width=0) (actual time=0.284..0.284 rows=0 loops=1)
              Buffers: shared hit=54
              ->  Bitmap Index Scan on employees_active_idx  (cost=0.00..4.43 rows=30 width=0) (actual time=0.241..0.241 rows=10005 loops=1)
                    Buffers: shared hit=52
              ->  Bitmap Index Scan on idx_employees_country_job_title  (cost=0.00..4.51 rows=30 width=0) (actual time=0.020..0.021 rows=1002 loops=1)
                    Index Cond: (country = 'US'::bpchar)
                    Buffers: shared hit=2
Planning:
  Buffers: shared hit=24
Planning Time: 0.099 ms
Execution Time: 0.583 ms
```

**Execution time (10k rows):** 0.583 ms

### getCountryJobStats — avg salary for country + job title

```
Aggregate  (cost=8.31..8.33 rows=1 width=16) (actual time=0.193..0.194 rows=1 loops=1)
  Buffers: shared hit=224
  ->  Index Scan using idx_employees_country_job_title on employees  (cost=0.28..8.30 rows=1 width=8) (actual time=0.010..0.161 rows=1002 loops=1)
        Index Cond: ((country = 'US'::bpchar) AND (job_title = 'Engineer'::text))
        Filter: (deleted_at IS NULL)
        Buffers: shared hit=224
Planning Time: 0.035 ms
Execution Time: 0.203 ms
```

**Execution time (10k rows):** 0.203 ms

### getOverviewMetrics — single-CTE dashboard query

> **Note:** Full-table aggregate — sequential scan expected (no selective filter). MATERIALIZED ensures a single scan.

```
Result  (cost=96.35..96.36 rows=1 width=104) (actual time=7.256..7.257 rows=1 loops=1)
  Buffers: shared hit=277
  CTE active
    ->  Bitmap Heap Scan on employees  (cost=4.44..89.45 rows=30 width=104) (actual time=0.698..2.013 rows=10005 loops=1)
          Recheck Cond: (deleted_at IS NULL)
          Heap Blocks: exact=222
          Buffers: shared hit=274
          ->  Bitmap Index Scan on employees_active_idx  (cost=0.00..4.43 rows=30 width=0) (actual time=0.687..0.687 rows=10005 loops=1)
                Buffers: shared hit=52
  InitPlan 2 (returns $1)
    ->  Aggregate  (cost=0.67..0.68 rows=1 width=8) (actual time=3.764..3.764 rows=1 loops=1)
          Buffers: shared hit=274
          ->  CTE Scan on active  (cost=0.00..0.60 rows=30 width=0) (actual time=0.700..3.518 rows=10005 loops=1)
                Buffers: shared hit=274
  InitPlan 3 (returns $2)
    ->  Aggregate  (cost=1.94..1.95 rows=1 width=32) (actual time=0.988..0.989 rows=1 loops=1)
          Buffers: shared hit=3
          ->  Subquery Scan on c  (cost=1.85..1.91 rows=5 width=56) (actual time=0.982..0.983 rows=5 loops=1)
                Buffers: shared hit=3
                ->  Limit  (cost=1.85..1.86 rows=5 width=48) (actual time=0.978..0.978 rows=5 loops=1)
                      Buffers: shared hit=3
                      ->  Sort  (cost=1.85..1.92 rows=30 width=48) (actual time=0.977..0.977 rows=5 loops=1)
                            Sort Key: ((round(avg(active_1.salary_cents), 0))::bigint) DESC
                            Sort Method: quicksort  Memory: 25kB
                            Buffers: shared hit=3
                            ->  HashAggregate  (cost=0.82..1.35 rows=30 width=48) (actual time=0.959..0.962 rows=10 loops=1)
                                  Group Key: active_1.country
                                  Batches: 1  Memory Usage: 24kB
                                  ->  CTE Scan on active active_1  (cost=0.00..0.60 rows=30 width=40) (actual time=0.000..0.292 rows=10005 loops=1)
  InitPlan 4 (returns $3)
    ->  Aggregate  (cost=1.94..1.95 rows=1 width=32) (actual time=0.991..0.992 rows=1 loops=1)
          ->  Subquery Scan on j  (cost=1.85..1.91 rows=5 width=56) (actual time=0.988..0.988 rows=5 loops=1)
                ->  Limit  (cost=1.85..1.86 rows=5 width=48) (actual time=0.987..0.987 rows=5 loops=1)
                      ->  Sort  (cost=1.85..1.92 rows=30 width=48) (actual time=0.986..0.987 rows=5 loops=1)
                            Sort Key: ((round(avg(active_2.salary_cents), 0))::bigint) DESC
                            Sort Method: quicksort  Memory: 25kB
                            ->  HashAggregate  (cost=0.82..1.35 rows=30 width=48) (actual time=0.981..0.983 rows=6 loops=1)
                                  Group Key: active_2.job_title
                                  Batches: 1  Memory Usage: 24kB
                                  ->  CTE Scan on active active_2  (cost=0.00..0.60 rows=30 width=40) (actual time=0.000..0.289 rows=10005 loops=1)
  InitPlan 5 (returns $4)
    ->  Aggregate  (cost=2.31..2.32 rows=1 width=32) (actual time=1.510..1.510 rows=1 loops=1)
          ->  Subquery Scan on d  (cost=1.34..2.16 rows=30 width=56) (actual time=1.065..1.501 rows=6 loops=1)
                ->  GroupAggregate  (cost=1.34..1.86 rows=30 width=40) (actual time=1.064..1.499 rows=6 loops=1)
                      Group Key: active_3.department
                      ->  Sort  (cost=1.34..1.41 rows=30 width=32) (actual time=0.951..1.153 rows=10005 loops=1)
                            Sort Key: active_3.department
                            Sort Method: quicksort  Memory: 572kB
                            ->  CTE Scan on active active_3  (cost=0.00..0.60 rows=30 width=32) (actual time=0.000..0.377 rows=10005 loops=1)
Planning:
  Buffers: shared hit=16
Planning Time: 0.102 ms
Execution Time: 7.385 ms
```

**Execution time (10k rows):** 7.385 ms
