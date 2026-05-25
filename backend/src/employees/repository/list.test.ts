import { describe, expect, it } from 'vitest';
import { withTestDb } from '../../test/helpers/db';
import { createEmployee, deleteEmployee, listEmployees } from './index';

const baseInput = {
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice.smith@example.com',
  jobTitle: 'Engineer',
  country: 'US',
  department: 'Engineering',
  salaryCents: 120_000,
  currency: 'USD',
  hireDate: '2024-01-15',
};

const employees = [
  {
    ...baseInput,
    firstName: 'Alice',
    email: 'alice@example.com',
    country: 'US',
    jobTitle: 'Engineer',
    salaryCents: 80_000,
  },
  {
    ...baseInput,
    firstName: 'Bob',
    email: 'bob@example.com',
    country: 'GB',
    jobTitle: 'Manager',
    salaryCents: 120_000,
  },
  {
    ...baseInput,
    firstName: 'Carol',
    email: 'carol@example.com',
    country: 'US',
    jobTitle: 'Engineer',
    salaryCents: 100_000,
  },
  {
    ...baseInput,
    firstName: 'Dave',
    email: 'dave@example.com',
    country: 'DE',
    jobTitle: 'Designer',
    salaryCents: 90_000,
  },
  {
    ...baseInput,
    firstName: 'Eve',
    email: 'eve@example.com',
    country: 'GB',
    jobTitle: 'Engineer',
    salaryCents: 110_000,
  },
];

describe('listEmployees', () => {
  it('returns all rows and correct total with no filters', async () => {
    await withTestDb(async (client) => {
      for (const e of employees) await createEmployee(client, e);

      const result = await listEmployees(client, {});
      expect(result.total).toBe(5);
      expect(result.data).toHaveLength(5);
    });
  });

  it('respects pageSize and page', async () => {
    await withTestDb(async (client) => {
      for (const e of employees) await createEmployee(client, e);

      const page1 = await listEmployees(client, { pageSize: 2, page: 1 });
      const page2 = await listEmployees(client, { pageSize: 2, page: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(2);
      expect(page1.total).toBe(5);
      const ids1 = page1.data.map((r) => r.id);
      const ids2 = page2.data.map((r) => r.id);
      expect(ids1.some((id) => ids2.includes(id))).toBe(false);
    });
  });

  it('filters by country', async () => {
    await withTestDb(async (client) => {
      for (const e of employees) await createEmployee(client, e);

      const result = await listEmployees(client, { country: 'GB' });
      expect(result.total).toBe(2);
      expect(result.data.every((r) => r.country === 'GB')).toBe(true);
    });
  });

  it('filters by jobTitle', async () => {
    await withTestDb(async (client) => {
      for (const e of employees) await createEmployee(client, e);

      const result = await listEmployees(client, { jobTitle: 'Engineer' });
      expect(result.total).toBe(3);
      expect(result.data.every((r) => r.jobTitle === 'Engineer')).toBe(true);
    });
  });

  it('filters by combined country + jobTitle', async () => {
    await withTestDb(async (client) => {
      for (const e of employees) await createEmployee(client, e);

      const result = await listEmployees(client, { country: 'US', jobTitle: 'Engineer' });
      expect(result.total).toBe(2);
      expect(result.data.every((r) => r.country === 'US' && r.jobTitle === 'Engineer')).toBe(true);
    });
  });

  it('searches by name (q)', async () => {
    await withTestDb(async (client) => {
      for (const e of employees) await createEmployee(client, e);

      const result = await listEmployees(client, { q: 'Carol' });
      expect(result.total).toBe(1);
      expect(result.data[0].firstName).toBe('Carol');
    });
  });

  it('sorts by salary_cents ascending', async () => {
    await withTestDb(async (client) => {
      for (const e of employees) await createEmployee(client, e);

      const result = await listEmployees(client, { sortBy: 'salary_cents', sortDir: 'asc' });
      const salaries = result.data.map((r) => r.salaryCents);
      expect(salaries).toEqual([...salaries].sort((a, b) => a - b));
    });
  });

  it('sorts by salary_cents descending', async () => {
    await withTestDb(async (client) => {
      for (const e of employees) await createEmployee(client, e);

      const result = await listEmployees(client, { sortBy: 'salary_cents', sortDir: 'desc' });
      const salaries = result.data.map((r) => r.salaryCents);
      expect(salaries).toEqual([...salaries].sort((a, b) => b - a));
    });
  });

  it('includes soft-deleted employees with isDeleted and deletedAt', async () => {
    await withTestDb(async (client) => {
      for (const e of employees) await createEmployee(client, e);
      const { data } = await listEmployees(client, {});
      await deleteEmployee(client, data[0].id);

      const result = await listEmployees(client, {});
      expect(result.total).toBe(5);
      const deleted = result.data.find((r) => r.id === data[0].id);
      expect(deleted).toBeDefined();
      expect(deleted!.isDeleted).toBe(true);
      expect(deleted!.deletedAt).toBeInstanceOf(Date);
    });
  });
});
