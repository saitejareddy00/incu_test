/**
 * Captures EXPLAIN (ANALYZE, BUFFERS) output for every insight and list query
 * against a 10 000-row dataset, then writes backend/docs/query-plans.md.
 *
 * Usage:
 *   DATABASE_URL=... tsx src/db/explain-plans.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });

async function explain(
  client: pg.PoolClient,
  label: string,
  sql: string,
  params: unknown[] = [],
): Promise<string> {
  const { rows } = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${sql}`, params);
  return rows.map((r: Record<string, string>) => r['QUERY PLAN']).join('\n');
}

async function seed10k(client: pg.PoolClient): Promise<void> {
  const { rows } = await client.query<{ count: string }>(
    'SELECT COUNT(*)::bigint AS count FROM employees',
  );
  const count = Number(rows[0].count);
  if (count >= 10_000) {
    console.log(`  already ${count} rows — skipping seed`);
    return;
  }

  console.log('  seeding 10 000 rows via generate_series…');
  await client.query(`
    INSERT INTO employees
      (first_name, last_name, email, job_title, country,
       department, salary_cents, currency, hire_date)
    SELECT
      'First'  || i,
      'Last'   || i,
      'user'   || i || '@explain-seed.example.com',
      (ARRAY['Engineer','Manager','Analyst','Designer','Director'])[1 + ((i - 1) % 5)],
      (ARRAY['US','GB','DE','FR','JP','CA','AU','IN','BR','MX'])[1 + ((i - 1) % 10)],
      (ARRAY['Engineering','Sales','Marketing','HR','Finance'])[1 + ((i - 1) % 5)],
      3_000_000 + (i % 25_000_000),
      'USD',
      '2018-01-01'::date + ((i % 2000) || ' days')::interval
    FROM generate_series(1, 10000) AS i
    ON CONFLICT (email) DO NOTHING
  `);
  console.log('  seeded');
}

interface QueryPlan {
  label: string;
  sql: string;
  params?: unknown[];
  note?: string;
}

const QUERIES: QueryPlan[] = [
  {
    label: 'listEmployees — country filter (idx_employees_country)',
    sql: `SELECT id, first_name, last_name, full_name, email, job_title,
                 country, department, salary_cents, currency, hire_date,
                 created_at, updated_at
          FROM employees
          WHERE deleted_at IS NULL
            AND country = $1
          ORDER BY full_name ASC
          LIMIT 20 OFFSET 0`,
    params: ['US'],
  },
  {
    label: 'listEmployees — job_title filter (idx_employees_job_title_trgm)',
    sql: `SELECT id, first_name, last_name, full_name, email, job_title,
                 country, department, salary_cents, currency, hire_date,
                 created_at, updated_at
          FROM employees
          WHERE deleted_at IS NULL
            AND job_title ILIKE $1
          ORDER BY full_name ASC
          LIMIT 20 OFFSET 0`,
    params: ['%Engineer%'],
  },
  {
    label: 'listEmployees — country + job_title (idx_employees_country_job_title)',
    sql: `SELECT id, first_name, last_name, full_name, email, job_title,
                 country, department, salary_cents, currency, hire_date,
                 created_at, updated_at
          FROM employees
          WHERE deleted_at IS NULL
            AND country   = $1
            AND job_title ILIKE $2
          ORDER BY full_name ASC
          LIMIT 20 OFFSET 0`,
    params: ['US', '%Engineer%'],
  },
  {
    label: 'listEmployees — name/email search ILIKE (trgm indexes)',
    sql: `SELECT id, first_name, last_name, full_name, email, job_title,
                 country, department, salary_cents, currency, hire_date,
                 created_at, updated_at
          FROM employees
          WHERE deleted_at IS NULL
            AND (full_name ILIKE $1 OR email ILIKE $1)
          ORDER BY full_name ASC
          LIMIT 20 OFFSET 0`,
    params: ['%First1%'],
    note: 'GIN trigram indexes (full_name, email) apply when the pattern has ≥ 3 fixed characters.',
  },
  {
    label: 'getCountryStats — salary aggregates for one country',
    sql: `SELECT
           MIN(salary_cents)::bigint                                              AS min,
           MAX(salary_cents)::bigint                                              AS max,
           ROUND(AVG(salary_cents))::bigint                                       AS avg,
           (percentile_cont(0.5) WITHIN GROUP (ORDER BY salary_cents))::bigint   AS median,
           COUNT(*)::bigint                                                        AS count
         FROM employees
         WHERE country = $1
           AND deleted_at IS NULL`,
    params: ['US'],
  },
  {
    label: 'getCountryJobStats — avg salary for country + job title',
    sql: `SELECT
           ROUND(AVG(salary_cents))::bigint AS avg,
           COUNT(*)::bigint                 AS count
         FROM employees
         WHERE country   = $1
           AND job_title = $2
           AND deleted_at IS NULL`,
    params: ['US', 'Engineer'],
  },
  {
    label: 'getOverviewMetrics — single-CTE dashboard query',
    sql: `WITH active AS MATERIALIZED (
           SELECT TRIM(country) AS country, job_title, department, salary_cents
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
               FROM   active GROUP BY country ORDER BY avg DESC LIMIT 5
             ) c
           ), '[]'::json) AS top_countries,
           COALESCE((
             SELECT json_agg(row_to_json(j))
             FROM (
               SELECT job_title AS "jobTitle",
                      ROUND(AVG(salary_cents))::bigint AS avg,
                      COUNT(*)::bigint                  AS count
               FROM   active GROUP BY job_title ORDER BY avg DESC LIMIT 5
             ) j
           ), '[]'::json) AS top_jobs,
           COALESCE((
             SELECT json_agg(row_to_json(d))
             FROM (
               SELECT department, COUNT(*)::bigint AS count
               FROM   active GROUP BY department ORDER BY department
             ) d
           ), '[]'::json) AS dept_headcount`,
    note: 'Full-table aggregate — sequential scan expected (no selective filter). MATERIALIZED ensures a single scan.',
  },
];

async function main(): Promise<void> {
  const client = await pool.connect();
  try {
    await seed10k(client);

    const sections: string[] = [];
    for (const q of QUERIES) {
      console.log(`  EXPLAIN: ${q.label}`);
      const plan = await explain(client, q.label, q.sql, q.params ?? []);
      const firstLine = plan.split('\n')[0];
      // Extract actual time from "Execution Time: X ms" at the end
      const timeMatch = plan.match(/Execution Time:\s+([\d.]+)\s+ms/);
      const execMs = timeMatch ? parseFloat(timeMatch[1]) : null;
      console.log(`    → ${firstLine.slice(0, 80)} | ${execMs != null ? execMs + ' ms' : '?'}`);

      sections.push(
        [
          `### ${q.label}`,
          '',
          q.note ? `> **Note:** ${q.note}\n` : '',
          '```',
          plan,
          '```',
          '',
          execMs != null ? `**Execution time (10k rows):** ${execMs} ms` : '',
          '',
        ]
          .filter((l) => l !== undefined)
          .join('\n'),
      );
    }

    const rowCountResult = await client.query<{ count: string }>(
      'SELECT COUNT(*)::bigint AS count FROM employees WHERE deleted_at IS NULL',
    );
    const activeRows = Number(rowCountResult.rows[0].count);

    const indexResult = await client.query<{ indexname: string; indexdef: string }>(
      `SELECT indexname, indexdef
       FROM   pg_indexes
       WHERE  tablename = 'employees'
       ORDER  BY indexname`,
    );

    const indexTable = indexResult.rows
      .map((r) => `| \`${r.indexname}\` | \`${r.indexdef}\` |`)
      .join('\n');

    const doc = [
      '# Query Plans — Salary Management Backend',
      '',
      `> Generated against **${activeRows.toLocaleString()} active rows** (10 000-row dataset).`,
      '> All timings are wall-clock from `EXPLAIN ANALYZE` on a development laptop.',
      '',
      '---',
      '',
      '## Indexes on `employees`',
      '',
      '| Index | Definition |',
      '|-------|------------|',
      indexTable,
      '',
      '---',
      '',
      '## Query Plans',
      '',
      ...sections,
    ].join('\n');

    const docsDir = path.join(__dirname, '../../docs');
    fs.mkdirSync(docsDir, { recursive: true });
    const outPath = path.join(docsDir, 'query-plans.md');
    fs.writeFileSync(outPath, doc, 'utf8');
    console.log(`\nWritten: ${outPath}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
