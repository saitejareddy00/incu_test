import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

const MIGRATION_FILE = path.join(__dirname, '001_create_employees.sql');

describe('001_create_employees.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  });

  it('migration file exists', () => {
    expect(fs.existsSync(MIGRATION_FILE)).toBe(true);
  });

  it('enables the pg_trgm extension', () => {
    expect(sql).toMatch(/CREATE EXTENSION IF NOT EXISTS pg_trgm/i);
  });

  it('creates the employees table', () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS employees/i);
  });

  it('uses uuid primary key with gen_random_uuid()', () => {
    expect(sql).toMatch(/id\s+uuid.*PRIMARY KEY/i);
    expect(sql).toMatch(/gen_random_uuid\(\)/i);
  });

  it('stores salary as bigint cents with a positive check', () => {
    expect(sql).toMatch(/salary_cents\s+bigint/i);
    expect(sql).toMatch(/salary_cents\s*>\s*0/i);
  });

  it('has a generated full_name stored column', () => {
    expect(sql).toMatch(/full_name.*GENERATED ALWAYS AS/i);
    expect(sql).toMatch(/STORED/i);
  });

  it('includes created_at and updated_at timestamptz columns', () => {
    expect(sql).toMatch(/created_at\s+timestamptz/i);
    expect(sql).toMatch(/updated_at\s+timestamptz/i);
  });

  it('has index on country', () => {
    expect(sql).toMatch(/CREATE INDEX.*ON employees\s*\(\s*country\s*\)/i);
  });

  it('has composite index on (country, job_title)', () => {
    expect(sql).toMatch(/CREATE INDEX.*ON employees\s*\(\s*country\s*,\s*job_title\s*\)/i);
  });

  it('has index on job_title', () => {
    expect(sql).toMatch(/CREATE INDEX.*ON employees\s*\(\s*job_title\s*\)/i);
  });

  it('has a trigram index on full_name', () => {
    expect(sql).toMatch(/CREATE INDEX.*USING gin.*full_name.*gin_trgm_ops/i);
  });
});
