import pg from 'pg';
import { loadEnv } from '../config/env';

let _pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!_pool) {
    const { databaseUrl } = loadEnv();
    _pool = new pg.Pool({ connectionString: databaseUrl });

    _pool.on('error', (err) => {
      console.error('Unexpected pg pool error', err);
    });
  }
  return _pool;
}

export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}
