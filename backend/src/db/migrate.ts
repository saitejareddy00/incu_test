import fs from 'fs';
import path from 'path';
import pg from 'pg';

const DEFAULT_MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   TEXT        PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`.trim();

export async function runMigrations(
  pool: pg.Pool,
  migrationsDir: string = DEFAULT_MIGRATIONS_DIR,
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query(CREATE_MIGRATIONS_TABLE);

    const { rows } = await client.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations',
    );
    const applied = new Set(rows.map((r) => r.filename));

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  ✓ ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    client.release();
  }
}
