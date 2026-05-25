import pg from 'pg';

/**
 * Deletes the employee with the given id.
 * Returns true if a row was deleted, false if no matching row was found.
 */
export async function deleteEmployee(client: pg.PoolClient, id: string): Promise<boolean> {
  const { rowCount } = await client.query('DELETE FROM employees WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}
