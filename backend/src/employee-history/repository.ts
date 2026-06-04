import pg from 'pg';
import type { CreateHistoryInput, EmployeeHistoryRow } from './schemas';

const HISTORY_COLUMNS = `
  h.id,
  h.employee_id    AS "employeeId",
  h.salary_cents   AS "salaryCents",
  h.job_title      AS "jobTitle",
  h.effective_from AS "effectiveFrom",
  h.effective_to   AS "effectiveTo",
  h.created_at     AS "createdAt",
  e.full_name      AS "fullName",
  e.email
`;

function toIsoDate(value: unknown): string {
  if (typeof value === 'string') return value.slice(0, 10);
  const d = value as Date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toRow(raw: Record<string, unknown>): EmployeeHistoryRow {
  return {
    ...(raw as EmployeeHistoryRow),
    salaryCents: Number(raw.salaryCents),
    effectiveFrom: toIsoDate(raw.effectiveFrom),
    effectiveTo: raw.effectiveTo != null ? toIsoDate(raw.effectiveTo) : null,
  };
}

export class EmployeeHistoryRepository {
  async insert(client: pg.PoolClient, input: CreateHistoryInput): Promise<EmployeeHistoryRow> {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO employee_history
         (employee_id, salary_cents, job_title, effective_from, effective_to)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [input.employeeId, input.salaryCents, input.jobTitle, input.effectiveFrom, input.effectiveTo],
    );

    const { rows: joined } = await client.query(
      `SELECT ${HISTORY_COLUMNS}
       FROM employee_history h
       JOIN employees e ON e.id = h.employee_id
       WHERE h.id = $1`,
      [rows[0].id],
    );

    return toRow(joined[0] as Record<string, unknown>);
  }

  async closeActive(client: pg.PoolClient, employeeId: string, effectiveTo: string): Promise<void> {
    await client.query(
      `UPDATE employee_history
       SET effective_to = $2
       WHERE employee_id = $1 AND effective_to IS NULL`,
      [employeeId, effectiveTo],
    );
  }

  async listByEmployee(
    client: pg.PoolClient,
    employeeId: string,
  ): Promise<EmployeeHistoryRow[]> {
    const { rows } = await client.query(
      `SELECT ${HISTORY_COLUMNS}
       FROM employee_history h
       JOIN employees e ON e.id = h.employee_id
       WHERE h.employee_id = $1
       ORDER BY h.effective_from DESC`,
      [employeeId],
    );

    return rows.map((r) => toRow(r as Record<string, unknown>));
  }
}
