import { describe, expect, it } from 'vitest';
import { getTestPool, withTestDb } from '../test/helpers/db';
import { EmployeeService } from './service';

const base = {
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
  jobTitle: 'Engineer',
  country: 'US',
  department: 'Engineering',
  salaryCents: 120_000,
  currency: 'USD',
  hireDate: '2024-01-15',
};

function service(client: import('pg').PoolClient): EmployeeService {
  return new EmployeeService(getTestPool(), client);
}

describe('create', () => {
  it('returns a row with generated id and timestamps', async () => {
    await withTestDb(async (client) => {
      const row = await service(client).create(base);

      expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(row.firstName).toBe('Alice');
      expect(row.fullName).toBe('Alice Smith');
      expect(row.createdAt).toBeInstanceOf(Date);
    });
  });

  it('throws ConflictError on duplicate email', async () => {
    await withTestDb(async (client) => {
      const svc = service(client);
      await svc.create(base);
      await expect(svc.create(base)).rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });
});

describe('getById', () => {
  it('returns the row when the employee exists', async () => {
    await withTestDb(async (client) => {
      const created = await service(client).create(base);
      const found = await service(client).getById(created.id);

      expect(found.id).toBe(created.id);
      expect(found.email).toBe(base.email);
    });
  });

  it('throws NotFoundError for an unknown id', async () => {
    await withTestDb(async (client) => {
      await expect(
        service(client).getById('00000000-0000-0000-0000-000000000000'),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  it('throws NotFoundError for a soft-deleted employee', async () => {
    await withTestDb(async (client) => {
      const svc = service(client);
      const created = await svc.create(base);
      await svc.delete(created.id);

      await expect(svc.getById(created.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});

describe('list', () => {
  it('returns all active employees with correct total', async () => {
    await withTestDb(async (client) => {
      const svc = service(client);
      await svc.create(base);
      await svc.create({ ...base, email: 'bob@example.com', firstName: 'Bob' });

      const result = await svc.list({});

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });
  });

  it('includes soft-deleted employees with isDeleted flag', async () => {
    await withTestDb(async (client) => {
      const svc = service(client);
      const emp = await svc.create(base);
      await svc.create({ ...base, email: 'bob@example.com', firstName: 'Bob' });
      await svc.delete(emp.id);

      const result = await svc.list({});

      expect(result.total).toBe(2);
      const deleted = result.data.find((r) => r.id === emp.id);
      expect(deleted?.isDeleted).toBe(true);
      expect(deleted?.deletedAt).toBeInstanceOf(Date);
      expect(result.data.find((r) => r.firstName === 'Bob')?.isDeleted).toBe(false);
    });
  });
});

describe('update', () => {
  it('returns the updated row', async () => {
    await withTestDb(async (client) => {
      const svc = service(client);
      const created = await svc.create(base);
      const updated = await svc.update(created.id, { salaryCents: 150_000 });

      expect(updated.salaryCents).toBe(150_000);
      expect(updated.email).toBe(base.email);
    });
  });

  it('throws NotFoundError for an unknown id', async () => {
    await withTestDb(async (client) => {
      await expect(
        service(client).update('00000000-0000-0000-0000-000000000000', { jobTitle: 'Ghost' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  it('throws NotFoundError for a soft-deleted employee', async () => {
    await withTestDb(async (client) => {
      const svc = service(client);
      const created = await svc.create(base);
      await svc.delete(created.id);

      await expect(svc.update(created.id, { jobTitle: 'Ghost' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  it('throws ConflictError on duplicate email', async () => {
    await withTestDb(async (client) => {
      const svc = service(client);
      const first = await svc.create(base);
      const second = await svc.create({ ...base, email: 'bob@example.com' });

      await expect(svc.update(second.id, { email: first.email })).rejects.toMatchObject({
        code: 'CONFLICT',
      });
    });
  });
});

describe('delete', () => {
  it('soft-deletes the employee (resolves without error)', async () => {
    await withTestDb(async (client) => {
      const svc = service(client);
      const created = await svc.create(base);
      await expect(svc.delete(created.id)).resolves.toBeUndefined();
    });
  });

  it('throws NotFoundError for an unknown id', async () => {
    await withTestDb(async (client) => {
      await expect(
        service(client).delete('00000000-0000-0000-0000-000000000000'),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  it('throws NotFoundError when the employee is already deleted', async () => {
    await withTestDb(async (client) => {
      const svc = service(client);
      const created = await svc.create(base);
      await svc.delete(created.id);

      await expect(svc.delete(created.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
