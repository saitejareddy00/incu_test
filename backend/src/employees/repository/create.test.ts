import { describe, expect, it } from 'vitest';
import { withTestDb } from '../../test/helpers/db';
import { createEmployee } from './index';

const baseInput = {
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice.smith@example.com',
  jobTitle: 'Engineer',
  country: 'US',
  department: 'Engineering',
  salaryCents: 120_000,
  currency: 'USD' as const,
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

      await expect(createEmployee(client, baseInput)).rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });
});
