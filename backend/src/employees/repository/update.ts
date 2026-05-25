import pg from 'pg';
import { ConflictError } from '../../app/errors';
import type { EmployeeRow, UpdateEmployeeInput } from '../schemas';
import { EMPLOYEE_COLUMNS, toRow } from './mappers';

/** Maps every updatable camelCase field to its snake_case DB column. */
const COLUMN_MAP: Record<keyof UpdateEmployeeInput, string> = {
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  jobTitle: 'job_title',
  country: 'country',
  department: 'department',
  salaryCents: 'salary_cents',
  currency: 'currency',
  hireDate: 'hire_date',
};

export async function updateEmployee(
  client: pg.PoolClient,
  id: string,
  patch: UpdateEmployeeInput,
): Promise<EmployeeRow | null> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return null;

  const params: unknown[] = [];
  const setClauses = entries.map(([key, value]) => {
    params.push(value);
    return `${COLUMN_MAP[key as keyof UpdateEmployeeInput]} = $${params.length}`;
  });

  params.push(id);
  const idParam = `$${params.length}`;

  try {
    const { rows } = await client.query(
      `UPDATE employees
       SET ${setClauses.join(', ')}
       WHERE id = ${idParam}
       RETURNING ${EMPLOYEE_COLUMNS}`,
      params,
    );
    return rows.length ? toRow(rows[0] as Record<string, unknown>) : null;
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      throw new ConflictError(`Email '${patch.email ?? ''}' is already taken`);
    }
    throw err;
  }
}
