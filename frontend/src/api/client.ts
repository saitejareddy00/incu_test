import {
  ApiResponseError,
  CountryJobStats,
  CountryStats,
  CreateEmployeeInput,
  Employee,
  EmployeeListParams,
  EmployeeListResponse,
  OverviewMetrics,
  UpdateEmployeeInput,
} from './types';

/** In production, set VITE_API_URL to the backend origin (no trailing slash). */
const API_ORIGIN = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const BASE = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = (await res
      .json()
      .catch(() => ({ error: { code: 'UNKNOWN', message: res.statusText } }))) as {
      error: { code: string; message: string };
    };
    throw new ApiResponseError(res.status, body.error);
  }

  // 204 No Content has no body to parse
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function toQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      q.set(key, String(value));
    }
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// ── Employees ─────────────────────────────────────────────────────────────────

export const employeesClient = {
  list(params: EmployeeListParams = {}): Promise<EmployeeListResponse> {
    return request(`/employees${toQuery(params as Record<string, unknown>)}`);
  },

  getById(id: string): Promise<Employee> {
    return request(`/employees/${encodeURIComponent(id)}`);
  },

  create(input: CreateEmployeeInput): Promise<Employee> {
    return request('/employees', { method: 'POST', body: JSON.stringify(input) });
  },

  update(id: string, patch: UpdateEmployeeInput): Promise<Employee> {
    return request(`/employees/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  delete(id: string): Promise<void> {
    return request(`/employees/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

// ── Insights ──────────────────────────────────────────────────────────────────

export const insightsClient = {
  overview(): Promise<OverviewMetrics> {
    return request('/insights/overview');
  },

  jobTitles(country?: string): Promise<{ jobTitles: string[] }> {
    const q = country ? `?country=${encodeURIComponent(country)}` : '';
    return request(`/insights/job-titles${q}`);
  },

  countryStats(country: string): Promise<CountryStats> {
    return request(`/insights/country/${encodeURIComponent(country)}`);
  },

  countryJobStats(country: string, jobTitle: string): Promise<CountryJobStats> {
    return request(
      `/insights/country/${encodeURIComponent(country)}/job-title/${encodeURIComponent(jobTitle)}`,
    );
  },
};
