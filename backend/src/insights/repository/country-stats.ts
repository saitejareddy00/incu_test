import pg from 'pg';

export interface CountryStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  count: number;
}

/**
 * Returns salary aggregates for all active employees in the given country,
 * or null when the country has no active employees.
 *
 * All monetary values are in cents (integer).
 * Median uses PostgreSQL's percentile_cont(0.5) — exact for odd-count sets,
 * interpolated midpoint for even-count sets.
 */
export async function getCountryStats(
  client: pg.PoolClient,
  country: string,
): Promise<CountryStats | null> {
  const { rows } = await client.query<{
    min: string | null;
    max: string | null;
    avg: string | null;
    median: string | null;
    count: string;
  }>(
    `SELECT
       MIN(salary_cents)::bigint                                              AS min,
       MAX(salary_cents)::bigint                                              AS max,
       ROUND(AVG(salary_cents))::bigint                                       AS avg,
       (percentile_cont(0.5) WITHIN GROUP (ORDER BY salary_cents))::bigint   AS median,
       COUNT(*)::bigint                                                        AS count
     FROM employees
     WHERE country = $1
       AND deleted_at IS NULL`,
    [country],
  );

  const row = rows[0];
  if (!row || row.min === null) return null;

  return {
    min: Number(row.min),
    max: Number(row.max),
    avg: Number(row.avg),
    median: Number(row.median),
    count: Number(row.count),
  };
}
