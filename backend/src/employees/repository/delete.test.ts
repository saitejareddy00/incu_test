import { describe, expect, it } from 'vitest';
import { withTestDb } from '../../test/helpers/db';
import { createEmployee, deleteEmployee, getEmployeeById } from './index';
import { baseInput } from './create.test';

describe('deleteEmployee', () => {
  it('soft-deletes an existing employee and returns true', async () => {
    await withTestDb(async (client) => {
      const created = await createEmployee(client, baseInput);

      const deleted = await deleteEmployee(client, created.id);

      expect(deleted).toBe(true);
      expect(await getEmployeeById(client, created.id)).toBeNull();
    });
  });

  it('row remains in the database with deleted_at set', async () => {
    await withTestDb(async (client) => {
      const created = await createEmployee(client, baseInput);

      await deleteEmployee(client, created.id);

      const { rows } = await client.query<{ deleted_at: Date | null }>(
        'SELECT deleted_at FROM employees WHERE id = $1',
        [created.id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].deleted_at).toBeInstanceOf(Date);
    });
  });

  it('soft-deleting an already-deleted employee returns false', async () => {
    await withTestDb(async (client) => {
      const created = await createEmployee(client, baseInput);
      await deleteEmployee(client, created.id);

      const result = await deleteEmployee(client, created.id);
      expect(result).toBe(false);
    });
  });

  it('returns false when the employee does not exist', async () => {
    await withTestDb(async (client) => {
      const result = await deleteEmployee(client, '00000000-0000-0000-0000-000000000000');
      expect(result).toBe(false);
    });
  });
});
