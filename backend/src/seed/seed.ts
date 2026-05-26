/**
 * Entry-point: `npm run seed` / `tsx src/seed/seed.ts [flags]`
 *
 * Pipeline:
 *  1. Parse CLI flags (config/validation — no I/O yet)
 *  2. Load name files once (streamed, O(lines) memory)
 *  3. Acquire a single pool client (one connection for the whole run)
 *  4. Optionally TRUNCATE
 *  5. Bulk-insert via batched COPY FROM STDIN (O(batchSize) peak memory)
 *  6. Print timing / throughput
 */
import 'dotenv/config';
import { resolve } from 'node:path';
import { getPool, closePool } from '../db/pool';
import { loadNames } from './loadNames';
import { mulberry32 } from './prng';
import { bulkInsert } from './bulkInsert';
import { parseArgs } from './cli';

const DATA_DIR = resolve(__dirname, '../../data');

async function run(): Promise<void> {
  // ── 1. Parse flags ─────────────────────────────────────────────────────────
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (msg) {
    process.stderr.write(String(msg) + '\n');
    process.exit(1);
  }

  const { count, seed, truncate, batchSize, analyze } = opts;
  console.log(
    `Seed config: count=${count} seed=${seed} truncate=${truncate} batchSize=${batchSize} analyze=${analyze}`,
  );

  // ── 2. Load names (streamed — files are read once, arrays reused per row) ──
  const [firstNames, lastNames] = await Promise.all([
    loadNames(resolve(DATA_DIR, 'first_names.txt')),
    loadNames(resolve(DATA_DIR, 'last_names.txt')),
  ]);
  console.log(`Name corpus: ${firstNames.length} first names, ${lastNames.length} last names`);

  // ── 3. DB connection ────────────────────────────────────────────────────────
  const pool = getPool();
  const client = await pool.connect();

  try {
    // ── 4. Truncate ───────────────────────────────────────────────────────────
    if (truncate) {
      await client.query('TRUNCATE employees RESTART IDENTITY CASCADE');
      console.log('Table truncated.');
    }

    // ── 5. Bulk insert ────────────────────────────────────────────────────────
    const rng = mulberry32(seed);
    const start = performance.now();

    const inserted = await bulkInsert({
      client,
      count,
      batchSize,
      rng,
      firstNames,
      lastNames,
    });

    if (analyze) {
      const analyzeStart = performance.now();
      await client.query('ANALYZE employees');
      console.log(
        `ANALYZE employees completed in ${((performance.now() - analyzeStart) / 1000).toFixed(2)}s`,
      );
    }

    const elapsedMs = performance.now() - start;
    const elapsedSec = elapsedMs / 1_000;
    const rowsPerSec = Math.round(inserted / elapsedSec);

    // ── 6. Report ─────────────────────────────────────────────────────────────
    console.log(`\nDone!`);
    console.log(`  Rows inserted : ${inserted.toLocaleString()}`);
    console.log(`  Elapsed       : ${elapsedSec.toFixed(2)}s`);
    console.log(`  Throughput    : ${rowsPerSec.toLocaleString()} rows/sec`);
  } finally {
    client.release();
    await closePool();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
