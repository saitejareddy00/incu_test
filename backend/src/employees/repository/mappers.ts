import type { EmployeeRow } from '../schemas';

export function toRow(raw: Record<string, unknown>): EmployeeRow {
  return {
    id: raw.id as string,
    firstName: raw.first_name as string,
    lastName: raw.last_name as string,
    fullName: raw.full_name as string,
    email: raw.email as string,
    jobTitle: raw.job_title as string,
    country: (raw.country as string).trim(),
    department: raw.department as string,
    salaryCents: Number(raw.salary_cents),
    currency: (raw.currency as string).trim(),
    hireDate: raw.hire_date as Date,
    createdAt: raw.created_at as Date,
    updatedAt: raw.updated_at as Date,
  };
}
