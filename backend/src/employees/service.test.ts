import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getTestPool } from '../test/helpers/db';
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

let service: EmployeeService;

beforeEach(() => {
  service = new EmployeeService(getTestPool());
});

afterEach(async () => {
  await getTestPool().query('DELETE FROM employees');
});

// ── create ────────────────────────────────────────────────────────────────────

describe('create', () => {
  it('returns a row with generated id and timestamps', async () => {
    const row = await service.create(base);

    expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(row.firstName).toBe('Alice');
    expect(row.fullName).toBe('Alice Smith');
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it('throws ConflictError on duplicate email', async () => {
    await service.create(base);

    await expect(service.create(base)).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});

// ── getById ───────────────────────────────────────────────────────────────────

describe('getById', () => {
  it('returns the row when the employee exists', async () => {
    const created = await service.create(base);

    const found = await service.getById(created.id);

    expect(found.id).toBe(created.id);
    expect(found.email).toBe(base.email);
  });

  it('throws NotFoundError for an unknown id', async () => {
    await expect(service.getById('00000000-0000-0000-0000-000000000000')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws NotFoundError for a soft-deleted employee', async () => {
    const created = await service.create(base);
    await service.delete(created.id);

    await expect(service.getById(created.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

// ── list ──────────────────────────────────────────────────────────────────────

describe('list', () => {
  it('returns all active employees with correct total', async () => {
    await service.create(base);
    await service.create({ ...base, email: 'bob@example.com', firstName: 'Bob' });

    const result = await service.list({});

    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('includes soft-deleted employees with isDeleted flag', async () => {
    const emp = await service.create(base);
    await service.create({ ...base, email: 'bob@example.com', firstName: 'Bob' });
    await service.delete(emp.id);

    const result = await service.list({});

    expect(result.total).toBe(2);
    const deleted = result.data.find((r) => r.id === emp.id);
    expect(deleted?.isDeleted).toBe(true);
    expect(deleted?.deletedAt).toBeInstanceOf(Date);
    expect(result.data.find((r) => r.firstName === 'Bob')?.isDeleted).toBe(false);
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe('update', () => {
  it('returns the updated row', async () => {
    const created = await service.create(base);

    const updated = await service.update(created.id, { salaryCents: 150_000 });

    expect(updated.salaryCents).toBe(150_000);
    expect(updated.email).toBe(base.email);
  });

  it('throws NotFoundError for an unknown id', async () => {
    await expect(
      service.update('00000000-0000-0000-0000-000000000000', { jobTitle: 'Ghost' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws NotFoundError for a soft-deleted employee', async () => {
    const created = await service.create(base);
    await service.delete(created.id);

    await expect(service.update(created.id, { jobTitle: 'Ghost' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws ConflictError on duplicate email', async () => {
    const first = await service.create(base);
    const second = await service.create({ ...base, email: 'bob@example.com' });

    await expect(service.update(second.id, { email: first.email })).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe('delete', () => {
  it('soft-deletes the employee (resolves without error)', async () => {
    const created = await service.create(base);

    await expect(service.delete(created.id)).resolves.toBeUndefined();
  });

  it('throws NotFoundError for an unknown id', async () => {
    await expect(service.delete('00000000-0000-0000-0000-000000000000')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws NotFoundError when the employee is already deleted', async () => {
    const created = await service.create(base);
    await service.delete(created.id);

    await expect(service.delete(created.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
