import pg from 'pg';
import type { EmployeeRow } from '../schemas';
import { EMPLOYEE_COLUMNS, toRow } from './mappers';

export async function getEmployeeById(
  client: pg.PoolClient,
  id: string,
): Promise<EmployeeRow | null> {
  const { rows } = await client.query(
    `SELECT ${EMPLOYEE_COLUMNS} FROM employees WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return rows.length ? toRow(rows[0] as Record<string, unknown>) : null;
}
