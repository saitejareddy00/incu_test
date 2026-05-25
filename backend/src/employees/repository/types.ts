import type { EmployeeRow } from '../schemas';

export const SORT_COLUMNS = [
  'full_name',
  'salary_cents',
  'hire_date',
  'country',
  'department',
] as const;

export type SortColumn = (typeof SORT_COLUMNS)[number];

/** API / UI sort keys (camelCase) → DB column names (snake_case). */
export const SORT_COLUMN_FROM_CAMEL: Record<string, SortColumn> = {
  fullName: 'full_name',
  salaryCents: 'salary_cents',
  hireDate: 'hire_date',
  country: 'country',
  department: 'department',
};

/** Accept camelCase or snake_case sort param; returns undefined if unrecognized. */
export function toSortColumn(value: string): SortColumn | undefined {
  if ((SORT_COLUMNS as readonly string[]).includes(value)) {
    return value as SortColumn;
  }
  return SORT_COLUMN_FROM_CAMEL[value];
}

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
