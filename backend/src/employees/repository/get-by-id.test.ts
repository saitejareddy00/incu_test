import { describe, expect, it } from 'vitest';
import { withTestDb } from '../../test/helpers/db';
import { createEmployee, getEmployeeById } from './index';
import { baseInput } from './create.test';

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
