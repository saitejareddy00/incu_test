# Project Board — Salary Management System

> Status key: `[x]` todo · `[~]` in progress · `[x]` done

---

## EPIC-0 · Foundations

### US-000 · Author board.md
**Status:** `[x]` done

**Goal:** Single source of truth for all epics, stories, and acceptance criteria lives in the repo from the first commit.

**Acceptance criteria:**
- `board.md` exists at the repo root.
- All epics (EPIC-0 through EPIC-8) are present with their stories.
- Each story has a clear goal and at least one acceptance criterion.
- Statuses are updatable inline (`[ ]` / `[~]` / `[x]`).

---

### US-001 · Repo structure + .gitignore + root README skeleton
**Status:** `[x]` todo

**Goal:** Establish the monorepo layout so every subsequent ticket has a clear home.

**Acceptance criteria:**
- Directories `backend/` and `frontend/` exist (may be empty placeholders).
- `.gitignore` covers Node, TypeScript build artefacts, `.env` files, and OS files.
- Root `README.md` contains at minimum: project title, brief description, and placeholder sections for Setup / Run / Test / Seed.
- `docker-compose.yml` placeholder or stub is present (fleshed out in US-002).
- CI passes (no linter errors on empty project).

---

### US-002 · docker-compose.yml (Postgres + app\_test DB)
**Status:** `[x]` todo

**Goal:** One command brings up the database dependencies needed for development and testing.

**Acceptance criteria:**
- `docker-compose up -d` starts a PostgreSQL 16 container.
- Two databases are created on first boot: `app` (development) and `app_test` (integration tests).
- Environment variables for connection are documented in a `.env.example`.
- `docker-compose down -v` cleanly tears down volumes.
- Health-check in compose file so dependent services wait for Postgres to be ready.

---

### US-003 · Backend scaffold (TS, Vitest, ESLint, Prettier, scripts)
**Status:** `[x]` todo

**Goal:** `backend/` is a fully configured TypeScript project that can compile, lint, and run tests before any application code exists.

**Acceptance criteria:**
- `backend/package.json` defines scripts: `dev`, `build`, `test`, `lint`, `format`.
- `tsconfig.json` targets ESNext with strict mode on.
- ESLint + Prettier configs are present and `lint` passes on an empty source tree.
- `vitest.config.ts` is present; `npm test` runs and exits 0 (zero tests = pass).
- `pino` and `express` (with types) are listed as dependencies.
- `zod` is listed as a dependency.

---

### US-004 · Frontend scaffold (Vite + MUI + TS + Vitest)
**Status:** `[x]` todo

**Goal:** `frontend/` bootstraps a Vite + React 18 + TypeScript app with MUI v5 and a working test runner.

**Acceptance criteria:**
- `frontend/package.json` defines scripts: `dev`, `build`, `preview`, `test`, `lint`.
- `vite.config.ts` is present; `npm run build` produces a `dist/` folder.
- MUI v5 is installed and a minimal `ThemeProvider` wraps `<App />`.
- `vitest` + `@testing-library/react` are installed; `npm test` exits 0.
- TanStack Query and React Hook Form + Zod resolver are listed as dependencies.

---

### US-005 · Curated first\_names.txt / last\_names.txt (~500 each)
**Status:** `[x]` todo

**Goal:** Deterministic seeding needs a curated name corpus.

**Acceptance criteria:**
- `backend/data/first_names.txt` and `backend/data/last_names.txt` exist.
- Each file contains ≥ 400 unique names, one per line, no blank lines.
- Names are UTF-8, mixed cultural origins (not solely Anglo-Saxon).
- Files are committed as plain text (no BOM).

---

## EPIC-1 · Backend Foundations

### US-101 · pg Pool + env config + graceful shutdown
**Status:** `[x]` todo

**Goal:** Application connects to Postgres via a managed pool and shuts down cleanly on SIGTERM/SIGINT.

**Acceptance criteria:**
- `src/db/pool.ts` exports a singleton `pg.Pool` configured from environment variables.
- Required env vars (`DATABASE_URL` or individual `PG_*` vars) are validated at startup using Zod; missing vars throw a descriptive error and exit non-zero.
- On SIGTERM / SIGINT the server stops accepting new connections, drains in-flight requests, and calls `pool.end()`.
- A unit test asserts that missing env vars cause startup to throw.

---

### US-102 · SQL migration runner (.sql files + schema\_migrations)
**Status:** `[x]` todo

**Goal:** Plain `.sql` migration files are applied in order and tracked so they run exactly once.

**Acceptance criteria:**
- `src/db/migrate.ts` reads `.sql` files from `src/db/migrations/` sorted lexicographically.
- A `schema_migrations` table (filename TEXT PK, applied\_at TIMESTAMPTZ) is created on first run.
- Already-applied migrations are skipped; new ones run inside a transaction.
- Running the runner twice on the same DB is idempotent.
- Unit tests cover: skip-already-applied, apply-new, rollback-on-error.

---

### US-103 · employees table migration + indexes
**Status:** `[x]` todo

**Goal:** The `employees` table exists in the database with the correct columns and indexes.

**Acceptance criteria:**
- Migration `001_create_employees.sql` creates the table as specified in the data model (uuid PK, generated `full_name`, `salary_cents` as bigint, etc.).
- Indexes exist on `(country)`, `(country, job_title)`, `(job_title)`, and a pg\_trgm trigram index on `full_name`.
- `pg_trgm` extension is enabled in the migration.
- Running `migrate.ts` against the test DB creates all objects without errors.
- A smoke test queries `SELECT 1 FROM employees LIMIT 1` and succeeds.

---

### US-104 · Express skeleton: health, error handler, request logger
**Status:** `[x]` todo

**Goal:** A runnable Express server responds to health checks and handles errors uniformly.

**Acceptance criteria:**
- `GET /health` returns `{ status: "ok", timestamp: "<ISO>" }` with HTTP 200.
- A global error handler middleware returns `{ error: { code, message } }` JSON for all thrown errors.
- Pino request logger middleware logs method, path, status, and response time for every request.
- `npm run dev` starts the server; `curl localhost:3000/health` returns 200.
- Supertest test asserts health endpoint shape and 200 status.

---

### US-105 · Test infra: test DB bootstrap + per-test transaction helper
**Status:** `[x]` todo

**Goal:** Integration tests run against a real Postgres `app_test` DB with full isolation and no state bleed between tests.

**Acceptance criteria:**
- `src/test/helpers/db.ts` exports `withTestDb(fn)`: opens a connection, begins a transaction, runs `fn`, then rolls back.
- Migrations are applied to `app_test` once before the full test suite (Vitest global setup).
- Tests using `withTestDb` can run in parallel without interfering.
- A sample integration test inserts a row and asserts it is visible inside the transaction but absent after rollback.
- `npm test` completes in under 30 seconds on a laptop.

---

## EPIC-2 · Employees CRUD (TDD)

### US-201 · Employee Zod schemas
**Status:** `[x]` todo

**Goal:** All employee data shapes are validated by shared Zod schemas used by both the API layer and the repository.

**Acceptance criteria:**
- `CreateEmployeeInput` schema validates required fields; rejects missing `email`, invalid `salary_cents ≤ 0`, blank strings.
- `UpdateEmployeeInput` schema makes all fields optional but applies the same per-field rules.
- `EmployeeRow` schema matches the DB column set (including `id`, `full_name`, timestamps).
- Unit tests cover: valid input passes, each invalid case fails with a descriptive message.

---

### US-202 · Repository: createEmployee
**Status:** `[x]` todo

**Goal:** Persist a new employee record and return the full row.

**Acceptance criteria (TDD red → green → refactor):**
- **Red:** failing tests assert `createEmployee(input)` returns a row with a generated UUID and `created_at`.
- **Green:** `INSERT ... RETURNING *` implementation makes tests pass.
- **Refactor:** row-mapper helper extracted; no behaviour change.
- Duplicate email throws a typed `ConflictError`.
- All tests use `withTestDb` (no state pollution).

---

### US-203 · Repository: getEmployeeById
**Status:** `[x]` todo

**Goal:** Fetch a single employee by UUID or return null.

**Acceptance criteria:**
- `getEmployeeById(id)` returns the full `EmployeeRow` when found.
- Returns `null` for an unknown UUID (not an exception).
- Unit test: found, not-found.

---

### US-204 · Repository: listEmployees (pagination, filter, sort, search)
**Status:** `[x]` todo

**Goal:** Return a paginated, filterable, sortable employee list with total count.

**Acceptance criteria:**
- Supports `page` + `pageSize` (default 20, max 100).
- Filter by `country` (exact) and `jobTitle` (exact).
- Full-text search via `q` parameter using the trigram index on `full_name`.
- Sortable by `full_name`, `salary_cents`, `hire_date`, `country`, `department` (asc/desc).
- Returns `{ data: EmployeeRow[], total: number }`.
- SQL is parameterised (no string interpolation of user input).
- Integration tests cover: pagination boundaries, each filter, search, sort, combined filters.

---

### US-205 · Repository: updateEmployee
**Status:** `[x]` todo

**Goal:** Partially update an employee's fields and return the updated row.

**Acceptance criteria:**
- `updateEmployee(id, patch)` accepts a partial record and updates only provided fields.
- `updated_at` is refreshed automatically.
- Returns the updated `EmployeeRow` or `null` if the ID is not found.
- Duplicate-email conflict throws `ConflictError`.
- Tests: partial update, not-found, email conflict.

---

### US-206 · Repository: deleteEmployee
**Status:** `[x]` todo

**Goal:** Remove an employee record by ID.

**Acceptance criteria:**
- `deleteEmployee(id)` returns `true` when deleted, `false` when not found.
- No foreign-key or cascade side-effects at this stage.
- Tests: delete existing, delete non-existent.

---

### US-207 · Service layer (unique email, business rules)
**Status:** `[x]` todo

**Goal:** Thin service layer that sits between controllers and the repository, enforcing business invariants.

**Acceptance criteria:**
- `EmployeeService.create` calls `createEmployee` and wraps `ConflictError` into a 409 HTTP-friendly error.
- `EmployeeService.update` re-checks email uniqueness if `email` is being changed.
- Service is unit-testable with a mocked repository.
- No direct DB calls inside service tests.

---

### US-208 · Controller + routes + supertest integration tests
**Status:** `[x]` todo

**Goal:** The five CRUD endpoints are wired into Express and tested end-to-end via supertest.

**Acceptance criteria:**
- `POST /api/employees` → 201 with full employee JSON.
- `GET /api/employees/:id` → 200 or 404.
- `GET /api/employees` → 200 with `{ data, total, page, pageSize }`.
- `PATCH /api/employees/:id` → 200 or 404.
- `DELETE /api/employees/:id` → 204 or 404.
- Validation errors return 400 with a structured body.
- Supertest tests cover happy path and key error cases for each endpoint.

---

## EPIC-3 · Salary Insights (TDD)

### US-301 · Country aggregates (min/max/avg/median/count)
**Status:** `[x]` todo

**Goal:** Compute salary statistics for all employees in a given country.

**Acceptance criteria:**
- `GET /api/insights/country/:country` returns `{ min, max, avg, median, count }` in cents.
- Median is computed with `percentile_cont(0.5)` inside Postgres.
- Returns 404 when the country has no employees.
- Integration test seeds known rows and asserts exact values.

---

### US-302 · Country + job title average
**Status:** `[x]` todo

**Goal:** Return average salary and headcount for a specific country + job-title combination.

**Acceptance criteria:**
- `GET /api/insights/country/:country/job-title/:jobTitle` returns `{ avg, count }`.
- Returns 404 when the combination has no employees.
- Integration test asserts values with seeded data.

---

### US-303 · Overview metrics
**Status:** `[x]` todo

**Goal:** Provide a high-level company-wide salary dashboard payload.

**Acceptance criteria:**
- `GET /api/insights/overview` returns:
  - `totalEmployees` (number)
  - `topCountriesByAvgSalary` (top 5, `[{ country, avg, count }]`)
  - `topJobTitlesByAvgSalary` (top 5, `[{ jobTitle, avg, count }]`)
  - `headcountByDepartment` (`[{ department, count }]`)
- All computed in a single round-trip or minimal queries.
- Integration test asserts shape and approximate values.

---

### US-304 · Insights controller + routes + integration tests
**Status:** `[x]` todo

**Goal:** Wire insight queries into Express and cover them with supertest tests.

**Acceptance criteria:**
- All three insight endpoints are registered under `/api/insights/`.
- Supertest tests cover: 200 happy path, 404 for unknown country/combination.
- Error handler is exercised (e.g., invalid country code → 400).

---

### US-305 · Query plan review + index verification
**Status:** `[x]` todo

**Goal:** Confirm that insight queries use indexes and perform acceptably at 10k rows.

**Acceptance criteria:**
- `EXPLAIN ANALYZE` output for each insight query is captured and committed as `backend/docs/query-plans.md`.
- Each plan shows index scan (not sequential scan) for country / job-title filters.
- Worst-case query completes in < 100 ms on a 10k-row dataset (recorded in the doc).

---

## EPIC-4 · Seeding Script

### US-401 · Names loader (streamed, deterministic)
**Status:** `[x]` todo

**Goal:** Load name lists from disk efficiently without reading entire files into memory.

**Acceptance criteria:**
- `loadNames(filePath)` returns `string[]` by streaming `first_names.txt` / `last_names.txt` line by line.
- Unit test asserts correct count and no blank entries on the actual data files.
- Function is pure and synchronous-friendly (returns a Promise).

---

### US-402 · Seeded PRNG + generators (country, job, salary, hire date)
**Status:** `[x]` todo

**Goal:** All random data is reproducible given the same seed value.

**Acceptance criteria:**
- A seeded PRNG (e.g., mulberry32 or similar) is implemented and unit-tested.
- `generateCountry(rng)`, `generateJobTitle(rng)`, `generateSalary(rng)`, `generateHireDate(rng)` produce values within defined ranges.
- Calling generators with the same seed twice produces identical sequences.
- Country list uses ISO-3166 alpha-2 codes; salary range is 30 000–300 000 USD (in cents).

---

### US-403 · Bulk insert via COPY (pg-copy-streams) + benchmark
**Status:** `[x]` todo

**Goal:** Insert 10 000 employee rows in well under 10 seconds using Postgres COPY.

**Acceptance criteria:**
- `seed.ts` uses `pg-copy-streams` COPY FROM STDIN to stream rows.
- Inserting 10 000 rows completes in < 5 seconds on a standard laptop (recorded).
- Emails are guaranteed unique by including the row index.
- Script runs without error against a clean `app` database.

---

### US-404 · CLI flags (--count, --seed, --truncate, --batch-size)
**Status:** `[x]` todo

**Goal:** The seed script is configurable from the command line.

**Acceptance criteria:**
- `--count N` seeds N rows (default 10 000).
- `--seed N` sets the PRNG seed (default 42).
- `--truncate` truncates the `employees` table before seeding.
- `--batch-size N` controls rows per COPY chunk (default 1 000).
- Invalid flag values print a usage message and exit non-zero.
- Unit tests cover flag parsing logic.

---

### US-405 · Seed README + recorded perf numbers
**Status:** `[x]` todo

**Goal:** Document how to use the seed script and capture performance results.

**Acceptance criteria:**
- `backend/docs/seed.md` explains all CLI flags with examples.
- Actual timing for 10k / 100k rows is recorded (wall time + rows/sec).
- Notes on how to regenerate with a different seed.

---

## EPIC-5 · Frontend Foundations

### US-501 · App shell, MUI theme, routing
**Status:** `[x]` todo

**Goal:** A navigable React shell with brand colours and route placeholders for every view.

**Acceptance criteria:**
- `AppBar` with app title and navigation links renders without errors.
- React Router (or TanStack Router) is configured with routes: `/` (dashboard), `/employees`, `/employees/:id`, `/insights`.
- MUI theme applies a custom primary colour.
- `npm run build` produces no TypeScript errors.

---

### US-502 · API client + TanStack Query setup
**Status:** `[x]` todo

**Goal:** All server communication goes through a typed API client wrapped in TanStack Query hooks.

**Acceptance criteria:**
- `src/api/client.ts` exports typed functions for every backend endpoint.
- `QueryClient` is provided at the root; `devtools` available in development.
- A custom hook `useEmployees(params)` fetches the list with pagination.
- Hook is unit-tested with MSW mocks (or similar).

---

### US-503 · Global error/toast/loading patterns
**Status:** `[x]` todo

**Goal:** Consistent UX for loading states, errors, and success feedback across all views.

**Acceptance criteria:**
- A `<Snackbar>` / toast system is set up and callable via a context or hook (`useNotify`).
- A full-page `<LoadingOverlay>` and an `<ErrorBanner>` component exist.
- TanStack Query's `onError` global handler triggers the toast.
- Components are tested with RTL: loading → data, and error states.

---

### US-504 · Reusable components (DataTable, FormDialog, ConfirmDialog)
**Status:** `[x]` todo

**Goal:** Shared UI primitives used by all employee and insight screens.

**Acceptance criteria:**
- `<DataTable columns rows total page pageSize onPageChange onSort />` renders an MUI Table with server-side pagination controls.
- `<FormDialog title open onClose children />` wraps MUI Dialog with a form layout.
- `<ConfirmDialog title message open onConfirm onCancel />` shows a destructive-action confirmation.
- Each component has RTL tests covering interaction (page change, close, confirm).

---

## EPIC-6 · Employee Management UI

### US-601 · Employees list (server pagination, sort, filter, search)
**Status:** `[x]` todo

**Goal:** HR Manager can browse all employees with filtering and sorting.

**Acceptance criteria:**
- `/employees` renders `<DataTable>` populated via `useEmployees`.
- Pagination controls change the `page` query param.
- Column headers are clickable for sort (asc/desc toggle).
- Filter bar accepts `country`, `jobTitle`, and free-text `q`.
- URL query params reflect current filter/sort/page state (shareable links).
- RTL tests: renders list, changes page, applies filter.

---

### US-602 · Create Employee form
**Status:** `[x]` todo

**Goal:** HR Manager can add a new employee via a dialog form.

**Acceptance criteria:**
- "Add Employee" button opens `<FormDialog>` with all required fields.
- Form uses React Hook Form + Zod resolver (client-side schema mirrors backend).
- On submit, calls `POST /api/employees`; on 201 invalidates query cache and closes dialog.
- Validation errors display inline beneath each field.
- RTL tests: renders form, validation errors shown, successful submit closes dialog.

---

### US-603 · Edit Employee form
**Status:** `[x]` todo

**Goal:** HR Manager can update any employee's details.

**Acceptance criteria:**
- Edit icon/button on the list row or detail view opens `<FormDialog>` pre-populated.
- On submit, calls `PATCH /api/employees/:id`; updates cache on 200.
- 409 email conflict surfaces as a field-level error.
- RTL tests: pre-populated values, patch sent, conflict error shown.

---

### US-604 · Delete with confirmation
**Status:** `[x]` todo

**Goal:** HR Manager can delete an employee with an explicit confirmation step.

**Acceptance criteria:**
- Delete icon on each row opens `<ConfirmDialog>`.
- Confirmed delete calls `DELETE /api/employees/:id` and removes row from list.
- Failed delete shows a toast error.
- RTL test: confirm triggers delete, cancel does not.

---

### US-605 · Employee detail view
**Status:** `[x]` todo

**Goal:** A dedicated page shows all fields for a single employee.

**Acceptance criteria:**
- `/employees/:id` fetches and displays the full employee record.
- Includes a back-link to the list, and Edit / Delete actions.
- Shows a 404 message when the ID is not found.
- RTL test: renders fields, shows 404 state.

---

## EPIC-7 · Salary Insights UI

### US-701 · Dashboard / overview page
**Status:** `[x]` todo

**Goal:** Landing page gives HR Manager a company-wide salary snapshot.

**Acceptance criteria:**
- `/` (or `/dashboard`) renders data from `GET /api/insights/overview`.
- Shows total headcount, top-5 countries by avg salary (bar or list), top-5 job titles, headcount by department.
- Loading and error states handled.
- RTL test: renders overview data from MSW mock.

---

### US-702 · Country insights view
**Status:** `[x]` todo

**Goal:** HR Manager can drill into salary stats for a specific country.

**Acceptance criteria:**
- `/insights?country=XX` fetches `GET /api/insights/country/:country`.
- Displays min, max, avg, median, count with MUI stat cards.
- Country selector updates the URL and re-fetches.
- RTL test: renders stats, updates on country change.

---

### US-703 · Country + Job title insights view
**Status:** `[x]` todo

**Goal:** HR Manager can narrow insights to a specific country + job title.

**Acceptance criteria:**
- `/insights?country=XX&jobTitle=YY` fetches the combined endpoint.
- Displays avg salary and headcount.
- Both filters visible and independently changeable.
- RTL test: renders combined stats.

---

### US-704 · Drill-down from list filters into insights
**Status:** `[x]` todo

**Goal:** Clicking a country or job-title filter on the employee list navigates to the relevant insights view.

**Acceptance criteria:**
- Country chip / filter on the employee list links to `/insights?country=XX`.
- Job-title filter links to `/insights?jobTitle=YY` (or combined with country if both active).
- Navigation is tested with RTL + router wrapper.

---

## EPIC-8 · Quality, Docs, Polish

### US-801 · Top-level README (setup, run, test, seed)
**Status:** `[x]` done

**Goal:** Any reviewer can clone the repo and have the app running in under 5 minutes by following the README.

**Acceptance criteria:**
- Sections: Prerequisites, Quick Start, Running Tests, Seeding, Environment Variables, Architecture Notes.
- Commands are copy-paste ready and tested against a clean checkout.
- Links to `board.md` and `backend/docs/seed.md`.

---

### US-802 · npm scripts orchestration
**Status:** `[x]` done

**Goal:** Common multi-package commands are runnable from the repo root.

**Acceptance criteria:**
- Root-level `Makefile` or `package.json` scripts (or both) provide: `dev`, `test`, `build`, `seed`, `lint`.
- `make dev` (or equivalent) starts both backend and frontend concurrently.
- `make test` runs backend + frontend test suites and exits non-zero if either fails.

---

### US-803 · Performance notes & known-limitations doc
**Status:** `[x]` done

**Goal:** Document what the system does well and where it would need work at larger scale.

**Acceptance criteria:**
- `backend/docs/performance.md` covers: query index usage, COPY seed throughput, pagination strategy.
- Known limitations section: no auth, single-table design, no caching layer, no rate limiting.
- Suggested next steps for productionisation.

---

*Last updated: US-803 done — EPIC-8 complete (performance.md added).*
