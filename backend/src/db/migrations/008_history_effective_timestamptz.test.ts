import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

const MIGRATION_FILE = path.join(__dirname, '008_history_effective_timestamptz.sql');

describe('008_history_effective_timestamptz.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  });

  it('migration file exists', () => {
    expect(fs.existsSync(MIGRATION_FILE)).toBe(true);
  });

  it('converts effective_from to timestamptz', () => {
    expect(sql).toMatch(/ALTER COLUMN effective_from TYPE TIMESTAMPTZ/i);
  });

  it('converts effective_to to timestamptz', () => {
    expect(sql).toMatch(/ALTER COLUMN effective_to TYPE TIMESTAMPTZ/i);
  });

  it('sets effective_from default to now()', () => {
    expect(sql).toMatch(/ALTER COLUMN effective_from SET DEFAULT now\(\)/i);
  });
});
