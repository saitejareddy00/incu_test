import pg from 'pg';

export interface OverviewMetrics {
  totalEmployees: number;
  topCountriesByAvgSalary: Array<{ country: string; avg: number; count: number }>;
  topJobTitlesByAvgSalary: Array<{ jobTitle: string; avg: number; count: number }>;
  headcountByDepartment: Array<{ department: string; count: number }>;
}

/**
 * Returns a company-wide salary dashboard payload by running four queries in
 * true parallel. Each pool.query() acquires its own connection, executes, and
 * releases immediately — no connection is held across all four queries.
 *
 * Accepts pg.Pool (not PoolClient) so that the four queries can actually run
 * concurrently. A single PoolClient serialises queries on one TCP connection,
 * making Promise.all misleading: parallelism is fake, and a failure leaves
 * queued queries on a connection about to be released.
 */
export async function getOverviewMetrics(pool: pg.Pool): Promise<OverviewMetrics> {
  const [totalResult, countriesResult, jobsResult, deptResult] = await Promise.all([
    pool.query<{ total: string }>(
      `SELECT COUNT(*)::bigint AS total
       FROM employees
       WHERE deleted_at IS NULL`,
    ),

    pool.query<{ country: string; avg: string; count: string }>(
      `SELECT TRIM(country)                      AS country,
              ROUND(AVG(salary_cents))::bigint    AS avg,
              COUNT(*)::bigint                    AS count
       FROM employees
       WHERE deleted_at IS NULL
       GROUP BY country
       ORDER BY avg DESC
       LIMIT 5`,
    ),

    pool.query<{ job_title: string; avg: string; count: string }>(
      `SELECT job_title,
              ROUND(AVG(salary_cents))::bigint    AS avg,
              COUNT(*)::bigint                    AS count
       FROM employees
       WHERE deleted_at IS NULL
       GROUP BY job_title
       ORDER BY avg DESC
       LIMIT 5`,
    ),

    pool.query<{ department: string; count: string }>(
      `SELECT department,
              COUNT(*)::bigint AS count
       FROM employees
       WHERE deleted_at IS NULL
       GROUP BY department
       ORDER BY department`,
    ),
  ]);

  return {
    totalEmployees: Number(totalResult.rows[0].total),
    topCountriesByAvgSalary: countriesResult.rows.map((r) => ({
      country: r.country,
      avg: Number(r.avg),
      count: Number(r.count),
    })),
    topJobTitlesByAvgSalary: jobsResult.rows.map((r) => ({
      jobTitle: r.job_title,
      avg: Number(r.avg),
      count: Number(r.count),
    })),
    headcountByDepartment: deptResult.rows.map((r) => ({
      department: r.department,
      count: Number(r.count),
    })),
  };
}
