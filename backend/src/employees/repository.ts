import pg from 'pg';
import { ConflictError } from '../app/errors';
import type { CreateEmployeeInput, EmployeeRow } from './schemas';

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
