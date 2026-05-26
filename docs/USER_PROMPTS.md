# User Prompts — Salary Management Application

This document collects the prompts you provided while building this project, in roughly chronological order. Minor duplicates (e.g. repeated **yes** to continue) are grouped where noted.

**Sources:** Agent transcripts for this repo (`ef147821`, `9fc5cb26`, `49fe22d2`).

---

## 1. Project kickoff (initial requirements)

> **Things to keep in mind**
>
> - Please follow **TDD** while completing the project, also do it into **multiple small commits** (I want to look at the steps).
> - Follow best practices for TDD.
> - Commit the changes frequently to show how the code evolves with every step of TDD.
> - **Do not rush**, take time — I want to see the best work!
>
> I want you to build an application for **salary management assessment**. I expect:
>
> - Demonstrate clarity in thought and structured problem solving
> - Show strong engineering fundamentals & product thinking
> - Make thoughtful architectural and design decisions
> - Write production-quality code and tests
>
> Please make **incremental commits** so we can understand how your solution evolved.
>
> **Goal:** Build a minimal yet usable salary management tool for an organization with **10,000 employees**.
>
> **User persona:** HR Manager of the org
>
> **Requirements — managing employees**
>
> - Add, view, update, and delete employees via UI
> - Employee must have full name, job title, country, salary, plus any other meaningful data you believe should be captured
>
> **Requirements — salary insights via UI**
>
> - Minimum, maximum, average salary of employees in a country
> - Average salary for a given job title in a country
> - Any other meaningful metrics helpful for the HR Manager persona
>
> **Technical constraints**
>
> - End-to-end, fully functional software (backend & UI)
> - Backend: Node.js with TypeScript, PostgreSQL
> - UI: React with TypeScript and MUI
> - Seeding: seed script with 10,000 employees; full names from `first_names.txt` + `last_names.txt`
> - **Assume engineers run this script regularly, and performance of the script matters**
> - Meaningful unit tests; fast, deterministic, easy to understand; good structure, readability, maintainability
>
> Initially create a **plan** with tasks/tickets/stories and **Epics** in a `board.md` file, with IDs for commits. Include FE, BE, and seeding stories. Also generate an **agile execution plan** for minimal resources and time. Act as a senior product manager.

---

## 2. Architecture plan implementation

> Implement the following to-dos from the plan (the plan is attached for your reference). **Do NOT edit the plan file itself.**
>
> You have been assigned: **[EPIC-0] Foundations** — repo layout, docker-compose, backend & frontend scaffolds, curated name files.
>
> Mark todos in progress as you work. Don't stop until all assigned to-dos are completed.

_(Attached: full architecture plan — Express + `pg`, Vite + MUI, COPY seeding, `board.md` epic breakdown, TDD commit cadence, sprint plan.)_

---

## 3. Process & workflow

| #   | Prompt                                                                                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Do **not** finish all the tasks; **after every task ask me** if you can proceed to the next one in the epic.                                 |
| 2   | Yes, but make sure it's the **npm original registry** when installing.                                                                       |
| 3   | Why are you importing using **await import** and also **js files**? Also: commit **failing tests first**, next commit should make them pass. |

---

## 4. EPIC-0 / tooling fixes

> Fix it, verify, and then give a concise explanation. `@backend/src/db/migrate.ts:1-3`

> Did you run those migrations or have you setup the database in local, or is it still in the plan in upcoming stories?

> Now referring to `@board.md`, can you complete **US-001**.

---

## 5. EPIC-2 — Employees CRUD (backend)

> What is **`q`** in the `ListEmployeesParams`? Also: assume yourself as a **staff software engineer** and **refactor the repository** into individual files (there might be new operations); refactor the logic in `listEmployees`.

> Instead of selecting `*` and converting to camelCase (overhead), write a function that uses Postgres **`AS`** to return camelCase upfront.

> `@update.ts (28-31)` — what happens when there is a key that is not part of the table? **Fix that case.**

> Instead of **hard deletes**, use **soft deletes**; also **split the repository test file** into smaller individual tests.

> **Error:** `DATABASE_URL` / `TEST_DATABASE_URL` required — why am I getting this when I run `npm run dev`?

> How can I **run migrations**?

> How can I **connect to the database**?

> `@types.ts (3-9)` — sort columns from params will be in **camelCase**; we need conversion.

---

## 6. EPIC-3 — Salary insights (backend)

> `@backend/src/insights/repository/overview.ts` — will this perform well with many requests? Does **`Promise.all`** return all results when one throws?

> Running **4 different queries** — can't we get all data in **one query** / one connection? If 100 users hit the dashboard, that's ~400 connections.

---

## 7. EPIC-5 — Frontend foundations

> Can you make sure the **UI looks like the Cursor UI** — use the same colors as the Cursor dashboard. _(Included reference image.)_

---

## 8. EPIC-6 — Employee management UI

> In the **data grid**, show the employee with a **letter avatar**, **name**, and **email** under the name.

> In the **Employee form**: country = **dropdown with codes**; joining date = **date selector**; on edit, fields **auto-filled** (date is datetime — autofills the date input).

> Format the **date** displayed in the grid and details.

> Make the **country search** on the employee page a **dropdown** too.

> `@frontend/src/pages/EmployeesPage.tsx` — use **React state** instead of URL `searchParams`.

> Add **debounced** behavior for changing the params.

> The employees endpoint should also return **deleted employees** with `is_deleted` and `deleted_at`; update UI to show deleted rows in **another color**.

---

## 9. EPIC-7 — Salary insights UI

> Extract **job title** below the shown insights; make it a **dropdown** from distinct job titles; when country is selected show **country-wide** insights; when job title is selected show **additional insights below**.

> Always render the job titles control but **keep it disabled** until a country is selected.

> The **dashboard** looks too normal — make it clearer and more understandable on landing; make it **interactive**.

> Modify the **insights page** to be more interactive and sophisticated, like the **usage page in Cursor**.

---

## 10. UI polish (post–EPIC-7)

> Modify the **Employee page** to match the other page design; improve look and feel; make the **form more sophisticated** (not just a skeleton).

---

## 11. EPIC-4 — Seeding script

> Can you **start EPIC-4 and finish**? Follow:
>
> - I/O efficiency
> - DB efficiency
> - Scalability
> - Repeatability
> - Memory usage
> - Maintainability
>
> The key phrase: _"engineers run this script regularly, and performance…"_ — strong signal for **bulk operations**, **minimal file reads**, **scalable generation**, **configurable execution**.

---

## 12. EPIC-8 — Quality & docs

> Can you also **finish EPIC-8**?

---

## 13. Meta / documentation

> Can you generate **all the prompts** that I have provided throughout this application in an **md file**?

---

## Notes

- Prompts are reproduced from conversation transcripts; wording may be lightly normalized (typos like “avergae” → noted as written in section 10).
- Attached files (plan excerpts, code selections, screenshots) are referenced in the original messages but not duplicated here in full.
- For the complete architecture spec, see the attached plan in the first implementation message or `board.md` in the repo root.

_Generated: May 26, 2026_
