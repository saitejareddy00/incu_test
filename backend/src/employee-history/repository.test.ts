import { describe, expect, it } from 'vitest';
import { withTestDb } from '../test/helpers/db';
import { createEmployee } from '../employees/repository/index';
import { baseInput } from '../employees/repository/create.test';
import { EmployeeHistoryRepository } from './repository';

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
          effectiveFrom: baseInput.hireDate,
          effectiveTo: null,
        });

        expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
        expect(row.employeeId).toBe(employee.id);
        expect(row.salaryCents).toBe(baseInput.salaryCents);
        expect(typeof row.salaryCents).toBe('number');
        expect(row.jobTitle).toBe(baseInput.jobTitle);
        expect(row.effectiveFrom).toBe(baseInput.hireDate);
        expect(row.effectiveTo).toBeNull();
        expect(row.createdAt).toBeInstanceOf(Date);
        expect(row.fullName).toBe('Alice Smith');
        expect(row.email).toBe(baseInput.email);
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
          effectiveFrom: baseInput.hireDate,
          effectiveTo: null,
        });

        await repo.closeActive(client, employee.id, '2024-06-01');

        const { rows } = await client.query<{ effective_to: string }>(
          'SELECT effective_to FROM employee_history WHERE employee_id = $1',
          [employee.id],
        );
        expect(rows).toHaveLength(1);
        expect(rows[0].effective_to).toBe('2024-06-01');
      });
    });
  });
});
