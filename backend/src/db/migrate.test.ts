import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runMigrations } from './migrate';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a temporary directory containing named .sql files. */
function makeTmpMigrationsDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrate-test-'));
  for (const [name, sql] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), sql, 'utf8');
  }
  return dir;
}

/** Builds a mock pg.PoolClient whose query() can be asserted on. */
function makeMockClient(appliedMigrations: string[] = []) {
  const query = vi.fn((sql: string) => {
    if (/SELECT filename FROM schema_migrations/.test(sql)) {
      return Promise.resolve({
        rows: appliedMigrations.map((filename) => ({ filename })),
        rowCount: appliedMigrations.length,
      });
    }
    return Promise.resolve({ rows: [], rowCount: 0 });
  });

  const release = vi.fn();

  return { query, release };
}

/** Builds a mock pg.Pool whose connect() returns the provided mock client. */
function makeMockPool(mockClient: ReturnType<typeof makeMockClient>) {
  return {
    connect: vi.fn(() =>
      Promise.resolve({
        query: mockClient.query,
        release: mockClient.release,
      }),
    ),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runMigrations', () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('applies new migrations in lexicographic order', async () => {
    tmpDir = makeTmpMigrationsDir({
      '002_add_index.sql': 'CREATE INDEX idx ON foo (bar);',
      '001_create_foo.sql': 'CREATE TABLE foo (id serial PRIMARY KEY);',
    });

    const client = makeMockClient([]);
    const pool = makeMockPool(client);

    await runMigrations(pool as never, tmpDir);

    const insertCalls = client.query.mock.calls.filter(([sql]: [string]) =>
      sql.trim().startsWith('INSERT INTO schema_migrations'),
    );
    expect(insertCalls).toHaveLength(2);
    // params[0] is the filename — order must be lexicographic
    expect(insertCalls[0][1]).toContain('001_create_foo.sql');
    expect(insertCalls[1][1]).toContain('002_add_index.sql');
  });

  it('skips already-applied migrations', async () => {
    tmpDir = makeTmpMigrationsDir({
      '001_create_foo.sql': 'CREATE TABLE foo (id serial PRIMARY KEY);',
      '002_add_index.sql': 'CREATE INDEX idx ON foo (bar);',
    });

    const client = makeMockClient(['001_create_foo.sql']);
    const pool = makeMockPool(client);

    await runMigrations(pool as never, tmpDir);

    const insertCalls = client.query.mock.calls.filter(([sql]: [string]) =>
      sql.trim().startsWith('INSERT INTO schema_migrations'),
    );
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0][1]).toContain('002_add_index.sql');
  });

  it('is idempotent — running twice with all applied does nothing', async () => {
    tmpDir = makeTmpMigrationsDir({
      '001_create_foo.sql': 'CREATE TABLE foo (id serial PRIMARY KEY);',
    });

    const client = makeMockClient(['001_create_foo.sql']);
    const pool = makeMockPool(client);

    await runMigrations(pool as never, tmpDir);
    await runMigrations(pool as never, tmpDir);

    const insertCalls = client.query.mock.calls.filter(([sql]: [string]) =>
      sql.trim().startsWith('INSERT INTO schema_migrations'),
    );
    expect(insertCalls).toHaveLength(0);
  });

  it('rolls back the transaction and rethrows on error', async () => {
    tmpDir = makeTmpMigrationsDir({
      '001_bad.sql': 'INVALID SQL THAT WILL FAIL;',
    });

    const client = makeMockClient([]);
    // Make the migration SQL itself throw
    client.query.mockImplementation((sql: string) => {
      if (sql.trim() === 'INVALID SQL THAT WILL FAIL;') {
        return Promise.reject(new Error('syntax error'));
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const pool = makeMockPool(client);

    await expect(runMigrations(pool as never, tmpDir)).rejects.toThrow('syntax error');

    const rollbackCalled = client.query.mock.calls.some(
      ([sql]: [string]) => sql.trim().toUpperCase() === 'ROLLBACK',
    );
    expect(rollbackCalled).toBe(true);
  });

  it('creates the schema_migrations table on first run', async () => {
    tmpDir = makeTmpMigrationsDir({});

    const client = makeMockClient([]);
    const pool = makeMockPool(client);

    await runMigrations(pool as never, tmpDir);

    const createCalled = client.query.mock.calls.some(([sql]: [string]) =>
      sql.includes('CREATE TABLE IF NOT EXISTS schema_migrations'),
    );
    expect(createCalled).toBe(true);
  });
});
