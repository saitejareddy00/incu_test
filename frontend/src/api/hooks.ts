import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesClient, insightsClient } from './client';
import type { CreateEmployeeInput, EmployeeListParams, UpdateEmployeeInput } from './types';

// ── Query keys ────────────────────────────────────────────────────────────────

export const queryKeys = {
  employees: {
    all: ['employees'] as const,
    list: (params: EmployeeListParams) => ['employees', 'list', params] as const,
    detail: (id: string) => ['employees', 'detail', id] as const,
  },
  insights: {
    all: ['insights'] as const,
    overview: ['insights', 'overview'] as const,
    jobTitles: (country?: string) => ['insights', 'jobTitles', country ?? ''] as const,
    country: (country: string) => ['insights', 'country', country] as const,
    countryJob: (country: string, jobTitle: string) =>
      ['insights', 'country', country, 'job', jobTitle] as const,
  },
};

// ── Employee hooks ────────────────────────────────────────────────────────────

export function useEmployees(params: EmployeeListParams) {
  return useQuery({
    queryKey: queryKeys.employees.list(params),
    queryFn: () => employeesClient.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => employeesClient.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => employeesClient.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      void qc.invalidateQueries({ queryKey: queryKeys.insights.all });
    },
  });
}

export function useUpdateEmployee(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateEmployeeInput) => employeesClient.update(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      void qc.invalidateQueries({ queryKey: queryKeys.insights.all });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesClient.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      void qc.invalidateQueries({ queryKey: queryKeys.insights.all });
    },
  });
}

// ── Insights hooks ────────────────────────────────────────────────────────────

export function useOverviewMetrics() {
  return useQuery({
    queryKey: queryKeys.insights.overview,
    queryFn: () => insightsClient.overview(),
  });
}

export function useJobTitles(country: string) {
  return useQuery({
    queryKey: queryKeys.insights.jobTitles(country),
    queryFn: () => insightsClient.jobTitles(country),
    enabled: Boolean(country),
  });
}

export function useCountryStats(country: string) {
  return useQuery({
    queryKey: queryKeys.insights.country(country),
    queryFn: () => insightsClient.countryStats(country),
    enabled: Boolean(country),
  });
}

export function useCountryJobStats(country: string, jobTitle: string) {
  return useQuery({
    queryKey: queryKeys.insights.countryJob(country, jobTitle),
    queryFn: () => insightsClient.countryJobStats(country, jobTitle),
    enabled: Boolean(country) && Boolean(jobTitle),
  });
}
