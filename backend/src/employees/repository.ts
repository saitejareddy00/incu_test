import pg from 'pg';
import { ConflictError } from '../app/errors';
import type { CreateEmployeeInput, EmployeeRow } from './schemas';

// ── listEmployees types ───────────────────────────────────────────────────────

const SORT_COLUMNS = ['full_name', 'salary_cents', 'hire_date', 'country', 'department'] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];

export interface ListEmployeesParams {
  page?: number;
  pageSize?: number;
  country?: string;
  jobTitle?: string;
  q?: string;
  sortBy?: SortColumn;
  sortDir?: 'asc' | 'desc';
}

export interface ListEmployeesResult {
  data: EmployeeRow[];
  total: number;
}

// ── Row mapper ────────────────────────────────────────────────────────────────

function toRow(raw: Record<string, unknown>): EmployeeRow {
  return {
    id: raw.id as string,
    firstName: raw.first_name as string,
    lastName: raw.last_name as string,
    fullName: raw.full_name as string,
    email: raw.email as string,
    jobTitle: raw.job_title as string,
    country: raw.country as string,
    department: raw.department as string,
    salaryCents: Number(raw.salary_cents),
    currency: raw.currency as string,
    hireDate: raw.hire_date as Date,
    createdAt: raw.created_at as Date,
    updatedAt: raw.updated_at as Date,
  };
}

// ── getEmployeeById ───────────────────────────────────────────────────────────

export async function getEmployeeById(
  client: pg.PoolClient,
  id: string,
): Promise<EmployeeRow | null> {
  const { rows } = await client.query('SELECT * FROM employees WHERE id = $1', [id]);
  return rows.length ? toRow(rows[0] as Record<string, unknown>) : null;
}

// ── listEmployees ─────────────────────────────────────────────────────────────

export async function listEmployees(
  client: pg.PoolClient,
  params: ListEmployeesParams,
): Promise<ListEmployeesResult> {
  const {
    page = 1,
    pageSize = 20,
    country,
    jobTitle,
    q,
    sortBy = 'full_name',
    sortDir = 'asc',
  } = params;

  const safeSort = SORT_COLUMNS.includes(sortBy) ? sortBy : 'full_name';
  const safeDir = sortDir === 'desc' ? 'DESC' : 'ASC';

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (country) {
    values.push(country);
    conditions.push(`country = $${values.length}`);
  }
  if (jobTitle) {
    values.push(jobTitle);
    conditions.push(`job_title = $${values.length}`);
  }
  if (q) {
    values.push(`%${q}%`);
    conditions.push(`full_name ILIKE $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await client.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM employees ${where}`,
    values,
  );
  const total = Number(countResult.rows[0].count);

  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);

  const { rows } = await client.query(
    `SELECT * FROM employees ${where}
     ORDER BY ${safeSort} ${safeDir}
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );

  return { data: rows.map((r) => toRow(r as Record<string, unknown>)), total };
}

// ── createEmployee ────────────────────────────────────────────────────────────

export async function createEmployee(
  client: pg.PoolClient,
  input: CreateEmployeeInput,
): Promise<EmployeeRow> {
  try {
    const { rows } = await client.query(
      `INSERT INTO employees
         (first_name, last_name, email, job_title, country, department,
          salary_cents, currency, hire_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.firstName,
        input.lastName,
        input.email,
        input.jobTitle,
        input.country,
        input.department,
        input.salaryCents,
        input.currency,
        input.hireDate,
      ],
    );
    return toRow(rows[0] as Record<string, unknown>);
  } catch (err) {
    // Postgres unique-violation code
    if ((err as { code?: string }).code === '23505') {
      throw new ConflictError(`Employee with email '${input.email}' already exists`);
    }
    throw err;
  }
}
