import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

const theme = createTheme();

const OVERVIEW = {
  totalEmployees: 42,
  topCountriesByAvgSalary: [
    { country: 'US', avg: 12_000_000, count: 20 },
    { country: 'GB', avg: 10_000_000, count: 12 },
  ],
  topJobTitlesByAvgSalary: [
    { jobTitle: 'Engineer', avg: 11_000_000, count: 15 },
    { jobTitle: 'Manager', avg: 13_000_000, count: 8 },
  ],
  headcountByDepartment: [
    { department: 'Engineering', count: 25 },
    { department: 'Sales', count: 17 },
  ],
};

const server = setupServer(
  http.get('/api/insights/overview', () => HttpResponse.json(OVERVIEW)),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe('DashboardPage', () => {
  it('renders total headcount from overview API', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
    expect(screen.getByText(/total employees/i)).toBeInTheDocument();
  });

  it('renders top countries by average salary', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('US')).toBeInTheDocument());
    expect(screen.getByText('GB')).toBeInTheDocument();
    expect(screen.getByText(/top countries/i)).toBeInTheDocument();
  });

  it('renders top job titles by average salary', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Engineer')).toBeInTheDocument());
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText(/top job titles/i)).toBeInTheDocument();
  });

  it('renders headcount by department', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Engineering')).toBeInTheDocument());
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText(/headcount by department/i)).toBeInTheDocument();
  });

  it('shows an error message when the API fails', async () => {
    server.use(
      http.get('/api/insights/overview', () =>
        HttpResponse.json({ error: { code: 'INTERNAL', message: 'Server error' } }, { status: 500 }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText(/server error/i)).toBeInTheDocument());
  });
});
