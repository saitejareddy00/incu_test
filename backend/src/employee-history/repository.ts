import pg from 'pg';
import type { CreateHistoryInput, EmployeeHistoryRow } from './schemas';

const HISTORY_COLUMNS = `
  id,
  employee_id    AS "employeeId",
  salary_cents   AS "salaryCents",
  job_title      AS "jobTitle",
  effective_from AS "effectiveFrom",
  effective_to   AS "effectiveTo",
  created_at     AS "createdAt"
`;

function toRow(raw: Record<string, unknown>): EmployeeHistoryRow {
  return {
    ...(raw as EmployeeHistoryRow),
    salaryCents: Number(raw.salaryCents),
    effectiveFrom: raw.effectiveFrom as Date,
    effectiveTo: raw.effectiveTo != null ? (raw.effectiveTo as Date) : null,
  };
}

export class EmployeeHistoryRepository {
  async insert(client: pg.PoolClient, input: CreateHistoryInput): Promise<EmployeeHistoryRow> {
    const effectiveFrom = input.effectiveFrom ?? new Date();

    const { rows } = await client.query(
      `INSERT INTO employee_history
         (employee_id, salary_cents, job_title, effective_from, effective_to)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${HISTORY_COLUMNS}`,
      [
        input.employeeId,
        input.salaryCents,
        input.jobTitle,
        effectiveFrom,
        input.effectiveTo ?? null,
      ],
    );

    return toRow(rows[0] as Record<string, unknown>);
  }

  async closeActive(client: pg.PoolClient, employeeId: string): Promise<void> {
    await client.query(
      `UPDATE employee_history
       SET effective_to = clock_timestamp()
       WHERE employee_id = $1 AND effective_to IS NULL`,
      [employeeId],
    );
  }

  async listByEmployee(client: pg.PoolClient, employeeId: string): Promise<EmployeeHistoryRow[]> {
    const { rows } = await client.query(
      `SELECT ${HISTORY_COLUMNS}
       FROM employee_history
       WHERE employee_id = $1
       ORDER BY effective_from DESC`,
      [employeeId],
    );

    return rows.map((r) => toRow(r as Record<string, unknown>));
  }
}
