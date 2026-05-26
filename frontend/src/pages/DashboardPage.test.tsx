import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const server = setupServer(http.get('/api/insights/overview', () => HttpResponse.json(OVERVIEW)));

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
    expect(screen.getByText('Active employees')).toBeInTheDocument();
  });

  it('renders insight highlights and what stands out section', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/what stands out/i)).toBeInTheDocument());
    expect(screen.getByText(/united states leads/i)).toBeInTheDocument();
  });

  it('renders countries in the default chart view', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Countries' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    );
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
  });

  it('switches to job titles view when tab is clicked', async () => {
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: 'Countries' }));

    await userEvent.click(screen.getByRole('button', { name: 'Job titles' }));

    await waitFor(() => expect(screen.getAllByText('Manager').length).toBeGreaterThan(0));
    expect(screen.getAllByText('Engineer').length).toBeGreaterThan(0);
  });

  it('links country rows to insights', async () => {
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: 'Countries' }));

    const countryLink = screen
      .getAllByRole('link')
      .find((el) => el.getAttribute('href') === '/insights?country=US');
    expect(countryLink).toBeDefined();
  });

  it('shows an error message when the API fails', async () => {
    server.use(
      http.get('/api/insights/overview', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL', message: 'Server error' } },
          { status: 500 },
        ),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText(/server error/i)).toBeInTheDocument());
  });
});
