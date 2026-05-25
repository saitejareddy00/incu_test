import pg from 'pg';

export interface OverviewMetrics {
  totalEmployees: number;
  topCountriesByAvgSalary: Array<{ country: string; avg: number; count: number }>;
  topJobTitlesByAvgSalary: Array<{ jobTitle: string; avg: number; count: number }>;
  headcountByDepartment: Array<{ department: string; count: number }>;
}

// Shape of the JSON arrays PostgreSQL returns; numbers inside JSON are already
// parsed as JS numbers by the pg driver's json type parser.
interface TopCountryRow {
  country: string;
  avg: number;
  count: number;
}
interface TopJobRow {
  jobTitle: string;
  avg: number;
  count: number;
}
interface DeptRow {
  department: string;
  count: number;
}

/**
 * Returns the company-wide dashboard payload in a single query and a single
 * connection.
 *
 * Using four separate pool.query() calls would consume 4 connections per
 * request (×N concurrent users = N×4 connections). This CTE version uses 1.
 *
 * MATERIALIZED forces PostgreSQL to scan `employees` once and derive all four
 * aggregations from that in-memory set — rather than inlining the CTE and
 * re-scanning the table four times.
 */
export async function getOverviewMetrics(pool: pg.Pool): Promise<OverviewMetrics> {
  const { rows } = await pool.query<{
    total_employees: string; // bigint column → string
    top_countries: TopCountryRow[]; // json column  → parsed array
    top_jobs: TopJobRow[]; // json column  → parsed array
    dept_headcount: DeptRow[]; // json column  → parsed array
  }>(`
    WITH active AS MATERIALIZED (
      SELECT TRIM(country) AS country,
             job_title,
             department,
             salary_cents
      FROM   employees
      WHERE  deleted_at IS NULL
    )
    SELECT
      (SELECT COUNT(*)::bigint FROM active) AS total_employees,

      COALESCE((
        SELECT json_agg(row_to_json(c))
        FROM (
          SELECT country,
                 ROUND(AVG(salary_cents))::bigint AS avg,
                 COUNT(*)::bigint                  AS count
          FROM   active
          GROUP  BY country
          ORDER  BY avg DESC
          LIMIT  5
        ) c
      ), '[]'::json) AS top_countries,

      COALESCE((
        SELECT json_agg(row_to_json(j))
        FROM (
          SELECT job_title           AS "jobTitle",
                 ROUND(AVG(salary_cents))::bigint AS avg,
                 COUNT(*)::bigint                  AS count
          FROM   active
          GROUP  BY job_title
          ORDER  BY avg DESC
          LIMIT  5
        ) j
      ), '[]'::json) AS top_jobs,

      COALESCE((
        SELECT json_agg(row_to_json(d))
        FROM (
          SELECT department,
                 COUNT(*)::bigint AS count
          FROM   active
          GROUP  BY department
          ORDER  BY department
        ) d
      ), '[]'::json) AS dept_headcount
  `);

  const row = rows[0];
  return {
    totalEmployees: Number(row.total_employees),
    topCountriesByAvgSalary: row.top_countries.map((r) => ({
      country: r.country,
      avg: r.avg,
      count: r.count,
    })),
    topJobTitlesByAvgSalary: row.top_jobs.map((r) => ({
      jobTitle: r.jobTitle,
      avg: r.avg,
      count: r.count,
    })),
    headcountByDepartment: row.dept_headcount.map((r) => ({
      department: r.department,
      count: r.count,
    })),
  };
}
