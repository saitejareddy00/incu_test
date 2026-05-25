import type { EmployeeRow } from '../schemas';

/**
 * Reusable SELECT column list with camelCase aliases.
 * Use in every query: `SELECT ${EMPLOYEE_COLUMNS} FROM employees …`
 * This eliminates the need for manual snake_case → camelCase remapping.
 */
export const EMPLOYEE_COLUMNS = `
  id,
  first_name    AS "firstName",
  last_name     AS "lastName",
  full_name     AS "fullName",
  email,
  job_title     AS "jobTitle",
  country,
  department,
  salary_cents  AS "salaryCents",
  currency,
  hire_date     AS "hireDate",
  created_at    AS "createdAt",
  updated_at    AS "updatedAt",
  (deleted_at IS NOT NULL) AS "isDeleted",
  deleted_at    AS "deletedAt"
`;

/**
 * Coerces the two things the pg driver can't auto-convert:
 *   - BIGINT salary_cents comes back as string → Number()
 *   - CHAR(n) columns come back padded → .trim()
 */
export function toRow(raw: Record<string, unknown>): EmployeeRow {
  const deletedAt = raw.deletedAt != null ? (raw.deletedAt as Date) : null;
  return {
    ...(raw as EmployeeRow),
    salaryCents: Number(raw.salaryCents),
    country: (raw.country as string).trim(),
    currency: (raw.currency as string).trim(),
    isDeleted: Boolean(raw.isDeleted),
    deletedAt,
  };
}
