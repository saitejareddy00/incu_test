import pg from 'pg';

/**
 * Soft-deletes the employee with the given id by setting deleted_at.
 * Returns true if the employee was found and active, false otherwise.
 * The row remains in the database and is excluded from all future queries.
 */
export async function deleteEmployee(client: pg.PoolClient, id: string): Promise<boolean> {
  const { rowCount } = await client.query(
    `UPDATE employees
     SET deleted_at = clock_timestamp()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (rowCount ?? 0) > 0;
}
