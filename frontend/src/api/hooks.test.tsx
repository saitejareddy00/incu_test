import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { useEmployees } from './hooks';

const server = setupServer(
  http.get('/api/employees', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    return HttpResponse.json({
      data: [
        {
          id: 'abc-123',
          firstName: 'Alice',
          lastName: 'Smith',
          fullName: 'Alice Smith',
          email: 'alice@example.com',
          jobTitle: 'Engineer',
          country: 'US',
          department: 'Engineering',
          salaryCents: 120_000,
          currency: 'USD',
          hireDate: '2024-01-15',
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
      ],
      total: 1,
      page,
      pageSize,
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useEmployees', () => {
  it('returns data and total on success', async () => {
    const { result } = renderHook(() => useEmployees({}), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.total).toBe(1);
    expect(result.current.data?.data[0].fullName).toBe('Alice Smith');
  });

  it('passes page and pageSize as query params', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/employees', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ data: [], total: 0, page: 2, pageSize: 10 });
      }),
    );

    const { result } = renderHook(() => useEmployees({ page: 2, pageSize: 10 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const params = new URL(capturedUrl).searchParams;
    expect(params.get('page')).toBe('2');
    expect(params.get('pageSize')).toBe('10');
  });

  it('is in loading state initially', () => {
    const { result } = renderHook(() => useEmployees({}), { wrapper });
    expect(result.current.isPending).toBe(true);
  });

  it('surfaces error when the server returns 500', async () => {
    server.use(
      http.get('/api/employees', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );

    const { result } = renderHook(() => useEmployees({}), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
