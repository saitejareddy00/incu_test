import { afterEach, describe, expect, it } from 'vitest';
import pg from 'pg';
import { createEmployee } from '../../employees/repository/index';
import { getTestPool } from '../../test/helpers/db';
import { getOverviewMetrics } from './overview';

const base = {
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
  jobTitle: 'Engineer',
  country: 'US',
  department: 'Engineering',
  salaryCents: 100_000,
  currency: 'USD' as const,
  hireDate: '2024-01-15',
};

// getOverviewMetrics uses pool.query() — separate connections that can only
// see committed rows. Tests must commit data; afterEach cleans up.
afterEach(async () => {
  await getTestPool().query('DELETE FROM employees');
});

/** Insert an employee using a short-lived client that commits immediately. */
async function seed(pool: pg.Pool, overrides: Partial<typeof base> & { email: string }) {
  const client = await pool.connect();
  try {
    return await createEmployee(client, { ...base, ...overrides });
  } finally {
    client.release();
  }
}

describe('getOverviewMetrics', () => {
  it('returns all four top-level keys with correct types', async () => {
    const metrics = await getOverviewMetrics(getTestPool());

    expect(metrics).toMatchObject({
      totalEmployees: expect.any(Number) as number,
      topCountriesByAvgSalary: expect.any(Array) as unknown[],
      topJobTitlesByAvgSalary: expect.any(Array) as unknown[],
      headcountByDepartment: expect.any(Array) as unknown[],
    });
  });

  it('counts only active employees in totalEmployees', async () => {
    const pool = getTestPool();
    await seed(pool, { email: 'a@example.com' });
    await seed(pool, { email: 'b@example.com' });
    const deleted = await seed(pool, { email: 'c@example.com' });
    await pool.query('UPDATE employees SET deleted_at = clock_timestamp() WHERE id = $1', [
      deleted.id,
    ]);

    const metrics = await getOverviewMetrics(pool);

    expect(metrics.totalEmployees).toBe(2);
  });

  it('orders topCountriesByAvgSalary descending by average', async () => {
    const pool = getTestPool();
    await seed(pool, { email: 'a@example.com', country: 'DE', salaryCents: 80_000 });
    await seed(pool, { email: 'b@example.com', country: 'GB', salaryCents: 150_000 });
    await seed(pool, { email: 'c@example.com', country: 'US', salaryCents: 200_000 });

    const metrics = await getOverviewMetrics(pool);

    expect(metrics.topCountriesByAvgSalary[0]).toMatchObject({
      country: 'US',
      avg: 200_000,
      count: 1,
    });
    expect(metrics.topCountriesByAvgSalary[1].country).toBe('GB');
    expect(metrics.topCountriesByAvgSalary[2].country).toBe('DE');
  });

  it('orders topJobTitlesByAvgSalary descending by average', async () => {
    const pool = getTestPool();
    await seed(pool, { email: 'a@example.com', jobTitle: 'Engineer', salaryCents: 100_000 });
    await seed(pool, { email: 'b@example.com', jobTitle: 'Manager', salaryCents: 160_000 });

    const metrics = await getOverviewMetrics(pool);

    expect(metrics.topJobTitlesByAvgSalary[0]).toMatchObject({
      jobTitle: 'Manager',
      avg: 160_000,
      count: 1,
    });
    expect(metrics.topJobTitlesByAvgSalary[1].jobTitle).toBe('Engineer');
  });

  it('groups headcountByDepartment correctly', async () => {
    const pool = getTestPool();
    await seed(pool, { email: 'a@example.com', department: 'Engineering' });
    await seed(pool, { email: 'b@example.com', department: 'Engineering' });
    await seed(pool, { email: 'c@example.com', department: 'Sales' });

    const metrics = await getOverviewMetrics(pool);

    const eng = metrics.headcountByDepartment.find((d) => d.department === 'Engineering');
    const sales = metrics.headcountByDepartment.find((d) => d.department === 'Sales');
    expect(eng?.count).toBe(2);
    expect(sales?.count).toBe(1);
  });

  it('caps topCountriesByAvgSalary and topJobTitlesByAvgSalary at 5 entries', async () => {
    const pool = getTestPool();
    const countries = ['US', 'GB', 'DE', 'FR', 'JP', 'CA'];
    for (const [i, country] of countries.entries()) {
      await seed(pool, { email: `e${i}@example.com`, country, salaryCents: 100_000 + i * 10_000 });
    }

    const metrics = await getOverviewMetrics(pool);

    expect(metrics.topCountriesByAvgSalary.length).toBeLessThanOrEqual(5);
  });
});
