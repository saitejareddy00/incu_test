import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { loadEnv } from '../config/env';
import { runMigrations } from '../db/migrate';

// Load .env before any env validation runs (globalSetup runs before Vite env loading)
dotenv.config({ path: path.join(__dirname, '../../.env') });

export async function setup(): Promise<void> {
  const { testDatabaseUrl } = loadEnv();
  const pool = new pg.Pool({ connectionString: testDatabaseUrl });
  try {
    await runMigrations(pool, path.join(__dirname, '../db/migrations'));
  } finally {
    await pool.end();
  }
}

export async function teardown(): Promise<void> {
  const { closeTestPool } = await import('./helpers/db');
  await closeTestPool();
}
