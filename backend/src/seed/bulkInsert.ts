import { from as copyFrom } from 'pg-copy-streams';
import type pg from 'pg';
import { type Rng } from './prng';
import { generateRow, type SeedRow } from './generators';

function escapeField(value: string | number): string {
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowToCsv(row: SeedRow): string {
  return [
    escapeField(row.firstName),
    escapeField(row.lastName),
    escapeField(row.email),
    escapeField(row.jobTitle),
    escapeField(row.country),
    escapeField(row.department),
    escapeField(row.salaryCents),
    escapeField(row.currency),
    escapeField(row.hireDate),
  ].join(',');
}

const COPY_SQL = `
  COPY employees (
    first_name, last_name, email,
    job_title, country, department,
    salary_cents, currency, hire_date
  )
  FROM STDIN
  WITH (FORMAT csv)
`.trim();

export interface BulkInsertOptions {
  client: pg.PoolClient;
  count: number;
  batchSize: number;
  rng: Rng;
  firstNames: readonly string[];
  lastNames: readonly string[];
  startIndex?: number;
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

export async function bulkInsert(opts: BulkInsertOptions): Promise<number> {
  const { client, count, batchSize, rng, firstNames, lastNames, startIndex = 0 } = opts;

  let inserted = 0;

  while (inserted < count) {
    const batchCount = Math.min(batchSize, count - inserted);

    await new Promise<void>((resolve, reject) => {
      const stream = client.query(copyFrom(COPY_SQL));
      stream.on('error', reject);

      (async () => {
        try {
          for (let i = 0; i < batchCount; i++) {
            const globalIndex = startIndex + inserted + i;
            const row = generateRow(rng, globalIndex, firstNames, lastNames);
            await writeChunk(stream, rowToCsv(row) + '\n');
          }
          stream.end();
          stream.on('finish', resolve);
        } catch (err) {
          reject(err);
        }
      })().catch(reject);
    });

    inserted += batchCount;
  }

  return inserted;
}
