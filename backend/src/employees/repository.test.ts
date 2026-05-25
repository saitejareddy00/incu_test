import { describe, it, expect } from 'vitest';
import { withTestDb } from '../test/helpers/db';
import { createEmployee, getEmployeeById, listEmployees, updateEmployee } from './repository/index';

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

describe('createEmployee', () => {
  it('returns a row with a generated UUID and timestamps', async () => {
    await withTestDb(async (client) => {
      const row = await createEmployee(client, baseInput);

      expect(row.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(row.createdAt).toBeInstanceOf(Date);
      expect(row.updatedAt).toBeInstanceOf(Date);
    });
  });

  it('returns all inserted fields correctly', async () => {
    await withTestDb(async (client) => {
      const row = await createEmployee(client, baseInput);

      expect(row.firstName).toBe('Alice');
      expect(row.lastName).toBe('Smith');
      expect(row.fullName).toBe('Alice Smith');
      expect(row.email).toBe('alice.smith@example.com');
      expect(row.jobTitle).toBe('Engineer');
      expect(row.country).toBe('US');
      expect(row.department).toBe('Engineering');
      expect(row.salaryCents).toBe(120_000);
      expect(row.currency).toBe('USD');
    });
  });

  it('throws ConflictError on duplicate email', async () => {
    await withTestDb(async (client) => {
      await createEmployee(client, baseInput);

      await expect(createEmployee(client, baseInput)).rejects.toMatchObject({
        code: 'CONFLICT',
      });
    });
  });
});

describe('getEmployeeById', () => {
  it('returns the full row when the employee exists', async () => {
    await withTestDb(async (client) => {
      const created = await createEmployee(client, baseInput);

      const found = await getEmployeeById(client, created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe(baseInput.email);
      expect(found?.fullName).toBe('Alice Smith');
    });
  });

  it('returns null for an unknown UUID', async () => {
    await withTestDb(async (client) => {
      const result = await getEmployeeById(client, '00000000-0000-0000-0000-000000000000');

      expect(result).toBeNull();
    });
  });
});

// ── listEmployees ─────────────────────────────────────────────────────────────

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
      // no overlap
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
});

// ── updateEmployee ────────────────────────────────────────────────────────────

describe('updateEmployee', () => {
  it('partially updates only the provided fields', async () => {
    await withTestDb(async (client) => {
      const created = await createEmployee(client, baseInput);

      const updated = await updateEmployee(client, created.id, {
        jobTitle: 'Senior Engineer',
        salaryCents: 150_000,
      });

      expect(updated).not.toBeNull();
      expect(updated?.jobTitle).toBe('Senior Engineer');
      expect(updated?.salaryCents).toBe(150_000);
      expect(updated?.email).toBe(baseInput.email);
      expect(updated?.firstName).toBe(baseInput.firstName);
    });
  });

  it('refreshes updatedAt on every update', async () => {
    await withTestDb(async (client) => {
      const created = await createEmployee(client, baseInput);
      await new Promise((r) => setTimeout(r, 10));

      const updated = await updateEmployee(client, created.id, { department: 'Platform' });

      expect(updated?.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });
  });

  it('returns null when the employee does not exist', async () => {
    await withTestDb(async (client) => {
      const result = await updateEmployee(client, '00000000-0000-0000-0000-000000000000', {
        jobTitle: 'Ghost',
      });
      expect(result).toBeNull();
    });
  });

  it('throws ConflictError when the new email is already taken', async () => {
    await withTestDb(async (client) => {
      const first = await createEmployee(client, baseInput);
      const second = await createEmployee(client, { ...baseInput, email: 'second@example.com' });

      await expect(updateEmployee(client, second.id, { email: first.email })).rejects.toMatchObject(
        { code: 'CONFLICT' },
      );
    });
  });
});
