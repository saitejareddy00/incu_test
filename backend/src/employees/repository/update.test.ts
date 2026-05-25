import { describe, expect, it } from 'vitest';
import { withTestDb } from '../../test/helpers/db';
import { createEmployee, deleteEmployee, updateEmployee } from './index';

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

  it('returns null for a soft-deleted employee', async () => {
    await withTestDb(async (client) => {
      const created = await createEmployee(client, baseInput);
      await deleteEmployee(client, created.id);

      const result = await updateEmployee(client, created.id, { jobTitle: 'Ghost' });
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
