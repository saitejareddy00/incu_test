import { from as copyFrom } from 'pg-copy-streams';
import type pg from 'pg';
import { generateHistoryForEmployee, type HistorySeedRow } from './generators';
import { type Rng } from './prng';

function escapeField(value: string | number): string {
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function pgDateToIso(value: unknown): string {
  if (typeof value === 'string') return value.slice(0, 10);
  const d = value as Date;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function historyRowToCsv(employeeId: string, row: HistorySeedRow): string {
  return [
    escapeField(employeeId),
    escapeField(row.salaryCents),
    escapeField(row.jobTitle),
    escapeField(row.effectiveFrom),
    row.effectiveTo ? escapeField(row.effectiveTo) : '',
  ].join(',');
}

const COPY_SQL = `
  COPY employee_history (
    employee_id, salary_cents, job_title, effective_from, effective_to
  )
  FROM STDIN
  WITH (FORMAT csv, NULL '')
`.trim();

interface EmployeeRow {
  id: string;
  hire_date: unknown;
  salary_cents: unknown;
  job_title: string;
}

export interface BulkInsertHistoryOptions {
  client: pg.PoolClient;
  batchSize: number;
  rng: Rng;
}

function writeChunk(stream: NodeJS.WritableStream, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ok = stream.write(data, 'utf8');
    if (ok) {
      resolve();
    } else {
      stream.once('drain', resolve);
      stream.once('error', reject);
    }
  });
}

async function copyHistoryLines(client: pg.PoolClient, lines: string[]): Promise<void> {
  if (lines.length === 0) return;

  await new Promise<void>((resolve, reject) => {
    const stream = client.query(copyFrom(COPY_SQL));
    stream.on('error', reject);

    (async () => {
      try {
        for (const line of lines) {
          await writeChunk(stream, line + '\n');
        }
        stream.end();
        stream.on('finish', resolve);
      } catch (err) {
        reject(err);
      }
    })().catch(reject);
  });
}

export async function bulkInsertHistory(opts: BulkInsertHistoryOptions): Promise<number> {
  const { client, batchSize, rng } = opts;
  let offset = 0;
  let inserted = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows } = await client.query<EmployeeRow>(
      `SELECT e.id, e.hire_date, e.salary_cents, e.job_title
       FROM employees e
       WHERE NOT EXISTS (
         SELECT 1 FROM employee_history h WHERE h.employee_id = e.id
       )
       ORDER BY e.email
       LIMIT $1 OFFSET $2`,
      [batchSize, offset],
    );

    if (rows.length === 0) break;

    const lines: string[] = [];
    for (const employee of rows) {
      const history = generateHistoryForEmployee(
        rng,
        pgDateToIso(employee.hire_date),
        Number(employee.salary_cents),
        employee.job_title,
      );
      for (const entry of history) {
        lines.push(historyRowToCsv(employee.id, entry));
      }
    }

    await copyHistoryLines(client, lines);
    inserted += lines.length;
    offset += rows.length;
  }

  return inserted;
}
