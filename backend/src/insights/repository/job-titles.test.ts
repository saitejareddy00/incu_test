import { describe, expect, it } from 'vitest';
import { createEmployee } from '../../employees/repository/index';
import { withTestDb } from '../../test/helpers/db';
import { listJobTitles } from './job-titles';

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

describe('listJobTitles', () => {
  it('returns distinct job titles across all active employees', async () => {
    await withTestDb(async (client) => {
      await createEmployee(client, { ...base, email: 'a@example.com', jobTitle: 'Engineer' });
      await createEmployee(client, { ...base, email: 'b@example.com', jobTitle: 'Manager' });
      await createEmployee(client, { ...base, email: 'c@example.com', jobTitle: 'Engineer' });

      const titles = await listJobTitles(client);
      expect(titles).toEqual(['Engineer', 'Manager']);
    });
  });

  it('filters job titles by country when provided', async () => {
    await withTestDb(async (client) => {
      await createEmployee(client, {
        ...base,
        email: 'a@example.com',
        jobTitle: 'Engineer',
        country: 'US',
      });
      await createEmployee(client, {
        ...base,
        email: 'b@example.com',
        jobTitle: 'Manager',
        country: 'GB',
      });

      const titles = await listJobTitles(client, 'US');
      expect(titles).toEqual(['Engineer']);
    });
  });
});
