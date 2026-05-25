/**
 * CLI entry point — runs all pending migrations against DATABASE_URL.
 * Kept separate from migrate.ts so the library module stays side-effect-free
 * and safe to import in tests without triggering dotenv or process.exit.
 */
import dotenv from 'dotenv';
import pg from 'pg';
import { runMigrations } from './migrate';

dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });

console.log('Running migrations…');
runMigrations(pool)
  .then(async () => {
    console.log('All migrations applied.');
    await pool.end();
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error('Migration failed:', err);
    void pool.end();
    process.exit(1);
  });
