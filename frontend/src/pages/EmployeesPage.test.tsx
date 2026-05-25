import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EmployeesPage from './EmployeesPage';

const theme = createTheme();

const EMPLOYEES = [
  {
    id: '1', firstName: 'Alice', lastName: 'Smith', fullName: 'Alice Smith',
    email: 'alice@example.com', jobTitle: 'Engineer', country: 'US',
    department: 'Engineering', salaryCents: 120_000, currency: 'USD',
    hireDate: '2024-01-15', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '2', firstName: 'Bob', lastName: 'Jones', fullName: 'Bob Jones',
    email: 'bob@example.com', jobTitle: 'Manager', country: 'GB',
    department: 'Sales', salaryCents: 150_000, currency: 'GBP',
    hireDate: '2023-06-01', createdAt: '2023-06-01T00:00:00Z', updatedAt: '2023-06-01T00:00:00Z',
  },
];

const server = setupServer(
  http.get('/api/employees', ({ request }) => {
    const url = new URL(request.url);
    const country = url.searchParams.get('country');
    const data = country ? EMPLOYEES.filter((e) => e.country === country) : EMPLOYEES;
    return HttpResponse.json({
      data,
      total: data.length,
      page: Number(url.searchParams.get('page') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 20),
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage(initialPath = '/employees') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/employees" element={<EmployeesPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe('EmployeesPage', () => {
  it('renders employee rows after data loads', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument());
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('renders column headers', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Alice Smith'));
    expect(screen.getByText(/name/i)).toBeInTheDocument();
    expect(screen.getByText(/job title/i)).toBeInTheDocument();
    expect(screen.getByText(/salary/i)).toBeInTheDocument();
  });

  it('filters by country when input changes', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Alice Smith'));

    const input = screen.getByPlaceholderText(/country/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'US');

    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument());
  });

  it('shows a page title', async () => {
    renderPage();
    expect(screen.getByText(/employees/i)).toBeInTheDocument();
  });

  it('shows total count in pagination', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Alice Smith'));
    // MUI pagination shows "1-2 of 2"
    expect(screen.getByText(/of 2/i)).toBeInTheDocument();
  });
});
