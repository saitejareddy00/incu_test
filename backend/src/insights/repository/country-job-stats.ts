import pg from 'pg';

export interface CountryJobStats {
  avg: number;
  count: number;
}

/**
 * Returns average salary (in cents) and headcount for active employees
 * matching the given country + job-title combination, or null when there
 * are no matching active employees.
 */
export async function getCountryJobStats(
  client: pg.PoolClient,
  country: string,
  jobTitle: string,
): Promise<CountryJobStats | null> {
  const { rows } = await client.query<{ avg: string | null; count: string }>(
    `SELECT
       ROUND(AVG(salary_cents))::bigint AS avg,
       COUNT(*)::bigint                 AS count
     FROM employees
     WHERE country  = $1
       AND job_title = $2
       AND deleted_at IS NULL`,
    [country, jobTitle],
  );

  const row = rows[0];
  if (!row || row.avg === null) return null;

  return {
    avg: Number(row.avg),
    count: Number(row.count),
  };
}
