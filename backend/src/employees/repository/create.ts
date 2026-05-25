import pg from 'pg';
import { ConflictError } from '../../app/errors';
import type { CreateEmployeeInput, EmployeeRow } from '../schemas';
import { toRow } from './mappers';

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
    if ((err as { code?: string }).code === '23505') {
      throw new ConflictError(`Employee with email '${input.email}' already exists`);
    }
    throw err;
  }
}
