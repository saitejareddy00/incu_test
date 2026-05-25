import pg from 'pg';
import type { EmployeeRow } from '../schemas';
import { toRow } from './mappers';

export async function getEmployeeById(
  client: pg.PoolClient,
  id: string,
): Promise<EmployeeRow | null> {
  const { rows } = await client.query('SELECT * FROM employees WHERE id = $1', [id]);
  return rows.length ? toRow(rows[0] as Record<string, unknown>) : null;
}
