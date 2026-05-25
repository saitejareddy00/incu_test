import pg from 'pg';
import { loadEnv } from '../../config/env';

let _testPool: pg.Pool | null = null;

export function getTestPool(): pg.Pool {
  if (!_testPool) {
    const { testDatabaseUrl } = loadEnv();
    _testPool = new pg.Pool({ connectionString: testDatabaseUrl });
  }
  return _testPool;
}

export async function closeTestPool(): Promise<void> {
  if (_testPool) {
    await _testPool.end();
    _testPool = null;
  }
}

/**
 * Runs `fn` inside a BEGIN…ROLLBACK transaction so every test starts clean.
 * The client is released and the transaction always rolled back, even on error.
 */
export async function withTestDb<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getTestPool().connect();
  await client.query('BEGIN');
  try {
    const result = await fn(client);
    return result;
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
}
