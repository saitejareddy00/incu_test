import type { EmployeeRow } from '../schemas';

export const SORT_COLUMNS = [
  'full_name',
  'salary_cents',
  'hire_date',
  'country',
  'department',
] as const;

export type SortColumn = (typeof SORT_COLUMNS)[number];

/** Parameters accepted by listEmployees. */
export interface ListEmployeesParams {
  page?: number;
  /** Max 100. Default 20. */
  pageSize?: number;
  /** ISO-3166 alpha-2 exact match. */
  country?: string;
  /** Exact job-title match. */
  jobTitle?: string;
  /** Free-text search against full_name via trigram index. */
  q?: string;
  sortBy?: SortColumn;
  sortDir?: 'asc' | 'desc';
}

export interface ListEmployeesResult {
  data: EmployeeRow[];
  total: number;
}
