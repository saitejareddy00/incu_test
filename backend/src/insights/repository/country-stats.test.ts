import { describe, expect, it } from 'vitest';
import { createEmployee } from '../../employees/repository/index';
import { withTestDb } from '../../test/helpers/db';
import { getCountryStats } from './country-stats';

const base = {
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
  jobTitle: 'Engineer',
  country: 'US',
  department: 'Engineering',
  salaryCents: 100_000,
  currency: 'USD',
  hireDate: '2024-01-15',
};

describe('getCountryStats', () => {
  it('returns exact min, max, avg, median and count for seeded data', async () => {
    await withTestDb(async (client) => {
      // Three US employees with known salaries: 80k, 100k, 120k
      await createEmployee(client, { ...base, email: 'a@example.com', salaryCents: 80_000 });
      await createEmployee(client, { ...base, email: 'b@example.com', salaryCents: 100_000 });
      await createEmployee(client, { ...base, email: 'c@example.com', salaryCents: 120_000 });
      // GB employee — must not appear in US stats
      await createEmployee(client, {
        ...base,
        email: 'd@example.com',
        country: 'GB',
        salaryCents: 999_999,
      });

      const stats = await getCountryStats(client, 'US');

      expect(stats).not.toBeNull();
      expect(stats?.count).toBe(3);
      expect(stats?.min).toBe(80_000);
      expect(stats?.max).toBe(120_000);
      // (80k + 100k + 120k) / 3 = 100k exactly
      expect(stats?.avg).toBe(100_000);
      // median of [80k, 100k, 120k] = 100k (percentile_cont middle value)
      expect(stats?.median).toBe(100_000);
    });
  });

  it('computes correct median for an even-count set', async () => {
    await withTestDb(async (client) => {
      // Two values: 80k and 120k — median = (80k + 120k) / 2 = 100k
      await createEmployee(client, { ...base, email: 'a@example.com', salaryCents: 80_000 });
      await createEmployee(client, { ...base, email: 'b@example.com', salaryCents: 120_000 });

      const stats = await getCountryStats(client, 'US');

      expect(stats?.median).toBe(100_000);
      expect(stats?.count).toBe(2);
    });
  });

  it('returns null when the country has no active employees', async () => {
    await withTestDb(async (client) => {
      const stats = await getCountryStats(client, 'ZZ');
      expect(stats).toBeNull();
    });
  });

  it('excludes soft-deleted employees from all aggregates', async () => {
    await withTestDb(async (client) => {
      const emp = await createEmployee(client, {
        ...base,
        email: 'a@example.com',
        salaryCents: 50_000,
      });
      await createEmployee(client, { ...base, email: 'b@example.com', salaryCents: 120_000 });
      // Soft-delete the first employee directly
      await client.query(
        'UPDATE employees SET deleted_at = clock_timestamp() WHERE id = $1',
        [emp.id],
      );

      const stats = await getCountryStats(client, 'US');

      expect(stats?.count).toBe(1);
      expect(stats?.min).toBe(120_000);
      expect(stats?.max).toBe(120_000);
      expect(stats?.median).toBe(120_000);
    });
  });
});
