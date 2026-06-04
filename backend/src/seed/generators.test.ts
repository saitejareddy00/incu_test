import { describe, expect, it } from 'vitest';
import { mulberry32 } from './prng';
import { EMPLOYEE_CURRENCY } from '../employees/currency';
import {
  COUNTRIES,
  generateCountry,
  generateDepartment,
  generateHireDate,
  generateHistoryForEmployee,
  generateJobTitle,
  generateRow,
  generateSalaryCents,
  HISTORY_END_DATE,
} from './generators';

const FIRST_NAMES = ['Alice', 'Bob', 'Carlos', 'Diana'];
const LAST_NAMES = ['Smith', 'Jones', 'García', 'Nguyen'];

describe('generateCountry', () => {
  it('returns a valid ISO-2 country code', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const c = generateCountry(rng);
      expect(COUNTRIES as readonly string[]).toContain(c);
    }
  });
});

describe('generateJobTitle', () => {
  it('returns a non-empty job title string', () => {
    const rng = mulberry32(2);
    for (let i = 0; i < 50; i++) {
      expect(generateJobTitle(rng).length).toBeGreaterThan(0);
    }
  });
});

describe('generateSalaryCents', () => {
  it('stays within the configured range [3_000_000, 30_000_000]', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 1_000; i++) {
      const v = generateSalaryCents(rng);
      expect(v).toBeGreaterThanOrEqual(3_000_000);
      expect(v).toBeLessThanOrEqual(30_000_000);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe('generateHireDate', () => {
  it('produces YYYY-MM-DD strings between 2015 and 2025', () => {
    const rng = mulberry32(4);
    const re = /^\d{4}-\d{2}-\d{2}$/;
    for (let i = 0; i < 200; i++) {
      const d = generateHireDate(rng);
      expect(re.test(d)).toBe(true);
      expect(d >= '2015-01-01').toBe(true);
      expect(d <= '2025-12-31').toBe(true);
    }
  });
});

describe('generateDepartment', () => {
  it('returns a non-empty string', () => {
    const rng = mulberry32(5);
    for (let i = 0; i < 50; i++) {
      expect(generateDepartment(rng).length).toBeGreaterThan(0);
    }
  });
});

describe('generateRow', () => {
  it('produces a row with all required fields', () => {
    const rng = mulberry32(42);
    const row = generateRow(rng, 0, FIRST_NAMES, LAST_NAMES);
    expect(row.firstName).toBeTruthy();
    expect(row.lastName).toBeTruthy();
    expect(row.email).toContain('@example.com');
    expect(row.email).toContain('.0@'); // index suffix
    expect(row.salaryCents).toBeGreaterThan(0);
    expect(row.hireDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('email uniqueness: index is embedded', () => {
    const emails = Array.from({ length: 5 }, (_, i) => {
      const rng = mulberry32(42 + i);
      return generateRow(rng, i, FIRST_NAMES, LAST_NAMES).email;
    });
    const unique = new Set(emails);
    expect(unique.size).toBe(5);
  });

  it('always uses USD (no per-country currency)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 50; i++) {
      const row = generateRow(rng, i, FIRST_NAMES, LAST_NAMES);
      expect(row.currency).toBe(EMPLOYEE_CURRENCY);
    }
  });

  it('same seed + index produces identical row (repeatability)', () => {
    const make = () => {
      const rng = mulberry32(42);
      return generateRow(rng, 0, FIRST_NAMES, LAST_NAMES);
    };
    expect(make()).toEqual(make());
  });
});

describe('generateHistoryForEmployee', () => {
  it('returns 1–4 periods', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 100; i++) {
      const rows = generateHistoryForEmployee(rng, '2020-01-01', 5_000_000, 'Engineer');
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows.length).toBeLessThanOrEqual(4);
    }
  });

  it('ends with the employee current salary and job title', () => {
    const rng = mulberry32(7);
    const rows = generateHistoryForEmployee(rng, '2020-01-01', 5_000_000, 'Staff Engineer');
    const last = rows[rows.length - 1];
    expect(last.salaryCents).toBe(5_000_000);
    expect(last.jobTitle).toBe('Staff Engineer');
    expect(last.effectiveTo).toBeNull();
  });

  it('satisfies effective_to IS NULL OR effective_to > effective_from', () => {
    const rng = mulberry32(11);
    for (let i = 0; i < 200; i++) {
      const rows = generateHistoryForEmployee(rng, '2018-06-01', 4_000_000, 'Engineer');
      for (const row of rows) {
        expect(row.effectiveFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        if (row.effectiveTo !== null) {
          expect(row.effectiveTo > row.effectiveFrom).toBe(true);
        }
      }
    }
  });

  it('is deterministic for the same rng sequence', () => {
    const make = () => {
      const rng = mulberry32(42);
      return generateHistoryForEmployee(rng, '2021-03-15', 6_000_000, 'Engineer');
    };
    expect(make()).toEqual(make());
  });

  it('falls back to one period when hire date is too close to end date', () => {
    const rng = mulberry32(3);
    const rows = generateHistoryForEmployee(rng, HISTORY_END_DATE, 3_000_000, 'Engineer');
    expect(rows).toHaveLength(1);
    expect(rows[0].effectiveFrom).toBe(HISTORY_END_DATE);
  });
});
