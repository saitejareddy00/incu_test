import { describe, expect, it } from 'vitest';
import { createEmployee } from '../../employees/repository/index';
import { withTestDb } from '../../test/helpers/db';
import { getCountryJobStats } from './country-job-stats';

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

describe('getCountryJobStats', () => {
  it('returns correct avg and count for a matching country + job title', async () => {
    await withTestDb(async (client) => {
      // Three US Engineers: 80k, 100k, 120k → avg 100k
      await createEmployee(client, { ...base, email: 'a@example.com', salaryCents: 80_000 });
      await createEmployee(client, { ...base, email: 'b@example.com', salaryCents: 100_000 });
      await createEmployee(client, { ...base, email: 'c@example.com', salaryCents: 120_000 });
      // US Manager — different job title, must not affect Engineer avg
      await createEmployee(client, {
        ...base,
        email: 'd@example.com',
        jobTitle: 'Manager',
        salaryCents: 200_000,
      });
      // GB Engineer — different country, must not affect US avg
      await createEmployee(client, {
        ...base,
        email: 'e@example.com',
        country: 'GB',
        salaryCents: 999_999,
      });

      const stats = await getCountryJobStats(client, 'US', 'Engineer');

      expect(stats).not.toBeNull();
      expect(stats?.count).toBe(3);
      expect(stats?.avg).toBe(100_000);
    });
  });

  it('returns null when no active employees match the combination', async () => {
    await withTestDb(async (client) => {
      const stats = await getCountryJobStats(client, 'ZZ', 'Ghost');
      expect(stats).toBeNull();
    });
  });

  it('excludes soft-deleted employees', async () => {
    await withTestDb(async (client) => {
      const emp = await createEmployee(client, {
        ...base,
        email: 'a@example.com',
        salaryCents: 60_000,
      });
      await createEmployee(client, { ...base, email: 'b@example.com', salaryCents: 140_000 });
      await client.query(
        'UPDATE employees SET deleted_at = clock_timestamp() WHERE id = $1',
        [emp.id],
      );

      const stats = await getCountryJobStats(client, 'US', 'Engineer');

      expect(stats?.count).toBe(1);
      expect(stats?.avg).toBe(140_000);
    });
  });
});
