# Salary Management System

A full-stack HR salary management application for browsing, managing, and analysing employee salary data.

**Stack:** Node.js + Express + TypeScript + PostgreSQL (backend) · Vite + React 18 + MUI v5 (frontend)

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Node.js](https://nodejs.org/) 20+
- npm 10+

---

## Quick Start

```bash
# 1. Start the database
docker compose up -d

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Copy env example and edit as needed
cp backend/.env.example backend/.env

# 4. Run backend (in backend/)
npm run dev

# 5. Run frontend (in frontend/)
npm run dev
```

---

## Running Tests

```bash
# Backend tests (unit + integration against app_test DB)
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

---

## Seeding

```bash
cd backend
npm run seed -- --count 10000 --seed 42 --truncate
```

See [`backend/docs/seed.md`](backend/docs/seed.md) for all CLI flags and performance notes.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env`. Key variables:

| Variable        | Default                                    | Description              |
|-----------------|--------------------------------------------|--------------------------|
| `DATABASE_URL`  | `postgres://app:app@localhost:5432/app`    | Main database connection |
| `TEST_DATABASE_URL` | `postgres://app:app@localhost:5432/app_test` | Test database         |
| `PORT`          | `3000`                                     | HTTP server port         |

---

## Architecture Notes

- Single `employees` table; salary stored as `bigint` cents (no float precision issues).
- Plain `.sql` migrations tracked via `schema_migrations` table — no ORM, no framework.
- Seeding uses `COPY ... FROM STDIN` via `pg-copy-streams` for sub-second 10k inserts.
- No authentication in scope (single HR Manager persona).

See [`board.md`](board.md) for the full epic/story breakdown.
