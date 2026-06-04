import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

const MIGRATION_FILE = path.join(__dirname, '007_create_employee_history.sql');

describe('007_create_employee_history.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  });

  it('migration file exists', () => {
    expect(fs.existsSync(MIGRATION_FILE)).toBe(true);
  });

  it('creates the employee_history table', () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS employee_history/i);
  });

  it('uses uuid primary key with gen_random_uuid()', () => {
    expect(sql).toMatch(/id\s+uuid.*PRIMARY KEY/i);
    expect(sql).toMatch(/gen_random_uuid\(\)/i);
  });

  it('references employees(id) with ON DELETE CASCADE', () => {
    expect(sql).toMatch(/employee_id\s+uuid.*REFERENCES employees\s*\(\s*id\s*\)/i);
    expect(sql).toMatch(/ON DELETE CASCADE/i);
  });

  it('stores salary as bigint cents with a positive check', () => {
    expect(sql).toMatch(/salary_cents\s+bigint/i);
    expect(sql).toMatch(/salary_cents\s*>\s*0/i);
  });

  it('has effective_from and nullable effective_to date columns', () => {
    expect(sql).toMatch(/effective_from\s+date/i);
    expect(sql).toMatch(/effective_to\s+date/i);
  });

  it('enforces effective_to IS NULL OR effective_to > effective_from', () => {
    expect(sql).toMatch(/effective_to IS NULL OR effective_to > effective_from/i);
  });

  it('has composite index on (employee_id, effective_from DESC)', () => {
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_employee_history_employee_id_effective_from/i);
    expect(sql).toMatch(/ON employee_history\s*\(\s*employee_id\s*,\s*effective_from DESC\s*\)/i);
  });
});
