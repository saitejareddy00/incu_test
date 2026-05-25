import { describe, expect, it } from 'vitest';
import { withTestDb } from '../../test/helpers/db';
import { createEmployee, deleteEmployee, getEmployeeById } from './index';

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

describe('deleteEmployee', () => {
  it('soft-deletes an existing employee and returns true', async () => {
    await withTestDb(async (client) => {
      const created = await createEmployee(client, baseInput);

      const deleted = await deleteEmployee(client, created.id);

      expect(deleted).toBe(true);
      expect(await getEmployeeById(client, created.id)).toBeNull();
    });
  });

  it('returns false when the employee does not exist', async () => {
    await withTestDb(async (client) => {
      const result = await deleteEmployee(client, '00000000-0000-0000-0000-000000000000');
      expect(result).toBe(false);
    });
  });
});
