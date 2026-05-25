import pg from 'pg';

/** Distinct active employee job titles, optionally scoped to a country. */
export async function listJobTitles(
  client: pg.PoolClient,
  country?: string,
): Promise<string[]> {
  const params: unknown[] = [];
  const conditions = ['deleted_at IS NULL'];

  if (country) {
    params.push(country);
    conditions.push(`country = $${params.length}`);
  }

  const { rows } = await client.query<{ job_title: string }>(
    `SELECT DISTINCT job_title
     FROM employees
     WHERE ${conditions.join(' AND ')}
     ORDER BY job_title ASC`,
    params,
  );

  return rows.map((r) => r.job_title);
}
