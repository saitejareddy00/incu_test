import { describe, expect, it } from 'vitest';
import { withTestDb } from '../test/helpers/db';
import { createEmployee } from '../employees/repository/index';
import { baseInput } from '../employees/repository/create.test';
import { EmployeeHistoryRepository } from './repository';
import { hireDateToEffectiveFrom } from './schemas';

const repo = new EmployeeHistoryRepository();

describe('EmployeeHistoryRepository', () => {
  describe('insert', () => {
    it('returns a row with numeric salaryCents and nullable effectiveTo', async () => {
      await withTestDb(async (client) => {
        const employee = await createEmployee(client, baseInput);

        const row = await repo.insert(client, {
          employeeId: employee.id,
          salaryCents: baseInput.salaryCents,
          jobTitle: baseInput.jobTitle,
          effectiveFrom: hireDateToEffectiveFrom(baseInput.hireDate),
          effectiveTo: null,
        });

        expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
        expect(row.employeeId).toBe(employee.id);
        expect(row.salaryCents).toBe(baseInput.salaryCents);
        expect(typeof row.salaryCents).toBe('number');
        expect(row.jobTitle).toBe(baseInput.jobTitle);
        expect(row.effectiveFrom).toEqual(new Date(hireDateToEffectiveFrom(baseInput.hireDate)));
        expect(row.effectiveTo).toBeNull();
        expect(row.createdAt).toBeInstanceOf(Date);
      });
    });

    it('defaults effective_from to now when omitted', async () => {
      await withTestDb(async (client) => {
        const employee = await createEmployee(client, baseInput);
        const before = Date.now();

        const row = await repo.insert(client, {
          employeeId: employee.id,
          salaryCents: baseInput.salaryCents,
          jobTitle: baseInput.jobTitle,
        });

        expect(row.effectiveFrom.getTime()).toBeGreaterThanOrEqual(before);
        expect(row.effectiveTo).toBeNull();
      });
    });
  });

  describe('closeActive', () => {
    it('sets effective_to on the open row only', async () => {
      await withTestDb(async (client) => {
        const employee = await createEmployee(client, baseInput);
        await repo.insert(client, {
          employeeId: employee.id,
          salaryCents: baseInput.salaryCents,
          jobTitle: baseInput.jobTitle,
          effectiveFrom: hireDateToEffectiveFrom(baseInput.hireDate),
          effectiveTo: null,
        });

        await repo.closeActive(client, employee.id);

        const { rows } = await client.query<{ effective_to: Date }>(
          'SELECT effective_to FROM employee_history WHERE employee_id = $1',
          [employee.id],
        );
        expect(rows).toHaveLength(1);
        expect(rows[0].effective_to).toBeInstanceOf(Date);
      });
    });
  });

  describe('listByEmployee', () => {
    it('returns rows ordered by effective_from DESC with joined employee fields', async () => {
      await withTestDb(async (client) => {
        const employee = await createEmployee(client, baseInput);
        await repo.insert(client, {
          employeeId: employee.id,
          salaryCents: 100_000,
          jobTitle: 'Junior Engineer',
          effectiveFrom: '2024-01-15T00:00:00.000Z',
          effectiveTo: '2024-06-01T12:00:00.000Z',
        });
        await repo.insert(client, {
          employeeId: employee.id,
          salaryCents: 120_000,
          jobTitle: 'Engineer',
          effectiveFrom: '2024-06-02T00:00:00.000Z',
          effectiveTo: null,
        });

        const rows = await repo.listByEmployee(client, employee.id);

        expect(rows).toHaveLength(2);
        expect(rows[0].salaryCents).toBe(120_000);
        expect(rows[0].effectiveFrom).toEqual(new Date('2024-06-02T00:00:00.000Z'));
        expect(rows[1].salaryCents).toBe(100_000);
        expect(rows[1].effectiveFrom).toEqual(new Date('2024-01-15T00:00:00.000Z'));
      });
    });

    it('returns an empty array when the employee has no history', async () => {
      await withTestDb(async (client) => {
        const employee = await createEmployee(client, baseInput);

        const rows = await repo.listByEmployee(client, employee.id);

        expect(rows).toEqual([]);
      });
    });
  });
});
