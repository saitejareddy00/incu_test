// ── Domain types (mirrors backend EmployeeRow) ───────────────────────────────

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  jobTitle: string;
  country: string;
  department: string;
  salaryCents: number;
  /** Always `USD` — insights aggregate salaries without FX conversion. */
  currency: 'USD';
  hireDate: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  country: string;
  department: string;
  salaryCents: number;
  /** Always `USD` — insights aggregate salaries without FX conversion. */
  currency: 'USD';
  hireDate: string;
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

// ── List response ─────────────────────────────────────────────────────────────

export interface EmployeeListParams {
  page?: number;
  pageSize?: number;
  country?: string;
  jobTitle?: string;
  q?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface EmployeeListResponse {
  data: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Insights types ────────────────────────────────────────────────────────────

export interface CountryStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  count: number;
}

export interface CountryJobStats {
  avg: number;
  count: number;
}

export interface OverviewMetrics {
  totalEmployees: number;
  topCountriesByAvgSalary: Array<{ country: string; avg: number; count: number }>;
  topJobTitlesByAvgSalary: Array<{ jobTitle: string; avg: number; count: number }>;
  headcountByDepartment: Array<{ department: string; count: number }>;
}

// ── API error ─────────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
}

export class ApiResponseError extends Error {
  constructor(
    public readonly status: number,
    public readonly error: ApiError,
  ) {
    super(error.message);
    this.name = 'ApiResponseError';
  }
}
