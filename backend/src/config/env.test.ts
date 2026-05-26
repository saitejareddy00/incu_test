import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadEnv } from './env';

describe('loadEnv', () => {
  const ORIGINAL = { ...process.env };

  beforeEach(() => {
    process.env = { ...ORIGINAL };
  });

  afterEach(() => {
    process.env = ORIGINAL;
  });

  it('returns a valid config when all required vars are present', () => {
    process.env.DATABASE_URL = 'postgres://app:app@localhost:5432/app';
    process.env.TEST_DATABASE_URL = 'postgres://app:app@localhost:5432/app_test';
    process.env.PORT = '3000';

    const cfg = loadEnv();

    expect(cfg.databaseUrl).toBe('postgres://app:app@localhost:5432/app');
    expect(cfg.testDatabaseUrl).toBe('postgres://app:app@localhost:5432/app_test');
    expect(cfg.port).toBe(3000);
  });

  it('uses default PORT of 3000 when PORT is not set', () => {
    process.env.DATABASE_URL = 'postgres://app:app@localhost:5432/app';
    process.env.TEST_DATABASE_URL = 'postgres://app:app@localhost:5432/app_test';
    delete process.env.PORT;

    const cfg = loadEnv();

    expect(cfg.port).toBe(3000);
  });

  it('throws a descriptive error when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    process.env.TEST_DATABASE_URL = 'postgres://app:app@localhost:5432/app_test';

    expect(() => loadEnv()).toThrow(/DATABASE_URL/);
  });

  it('falls back to DATABASE_URL when TEST_DATABASE_URL is missing', () => {
    process.env.DATABASE_URL = 'postgres://app:app@localhost:5432/app';
    delete process.env.TEST_DATABASE_URL;

    const cfg = loadEnv();

    expect(cfg.testDatabaseUrl).toBe(cfg.databaseUrl);
  });
});
