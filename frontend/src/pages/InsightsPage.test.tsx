import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import InsightsPage from './InsightsPage';

const theme = createTheme();

const US_STATS = { min: 80_000, max: 200_000, avg: 120_000, median: 115_000, count: 10 };
const GB_STATS = { min: 90_000, max: 180_000, avg: 130_000, median: 125_000, count: 5 };

const server = setupServer(
  http.get('/api/insights/country/US', () => HttpResponse.json(US_STATS)),
  http.get('/api/insights/country/GB', () => HttpResponse.json(GB_STATS)),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage(initialPath = '/insights?country=US') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [{ path: '/insights', element: <InsightsPage /> }],
    { initialEntries: [initialPath] },
  );
  render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return router;
}

describe('InsightsPage — country view', () => {
  it('renders salary stat cards for the country in the URL', async () => {
    renderPage('/insights?country=US');
    await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument());
    expect(screen.getByText(/employees/i)).toBeInTheDocument();
    expect(screen.getByText(/minimum/i)).toBeInTheDocument();
    expect(screen.getByText(/maximum/i)).toBeInTheDocument();
    expect(screen.getByText(/average/i)).toBeInTheDocument();
    expect(screen.getByText(/median/i)).toBeInTheDocument();
  });

  it('re-fetches and updates stats when country selector changes', async () => {
    renderPage('/insights?country=US');
    await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument());

    const countryInput = screen.getByRole('combobox', { name: /country/i });
    await userEvent.clear(countryInput);
    await userEvent.type(countryInput, 'United Kingdom');
    await userEvent.click(await screen.findByText(/united kingdom/i));

    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
    expect(screen.queryByText('10')).not.toBeInTheDocument();
  });

  it('updates the URL when a country is selected', async () => {
    const router = renderPage('/insights');
    const countryInput = screen.getByRole('combobox', { name: /country/i });
    await userEvent.type(countryInput, 'United States');
    await userEvent.click(await screen.findByText(/united states/i));

    await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument());
    expect(router.state.location.search).toBe('?country=US');
  });
});

const ENGINEER_STATS = { avg: 110_000, count: 3 };
const MANAGER_STATS = { avg: 150_000, count: 2 };

describe('InsightsPage — country + job title view', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/insights/country/US/job-title/Engineer', () =>
        HttpResponse.json(ENGINEER_STATS),
      ),
      http.get('/api/insights/country/US/job-title/Manager', () =>
        HttpResponse.json(MANAGER_STATS),
      ),
    );
  });

  it('renders combined avg and headcount when country and jobTitle are in the URL', async () => {
    renderPage('/insights?country=US&jobTitle=Engineer');
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
    expect(screen.getByText(/average salary/i)).toBeInTheDocument();
    expect(screen.queryByText(/median/i)).not.toBeInTheDocument();
  });

  it('updates combined stats when job title filter changes', async () => {
    renderPage('/insights?country=US&jobTitle=Engineer');
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());

    const jobInput = screen.getByLabelText(/job title/i);
    await userEvent.clear(jobInput);
    await userEvent.type(jobInput, 'Manager');

    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('updates the URL when job title changes', async () => {
    const router = renderPage('/insights?country=US');
    await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument());

    const jobInput = screen.getByLabelText(/job title/i);
    await userEvent.type(jobInput, 'Engineer');

    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
    expect(router.state.location.search).toContain('jobTitle=Engineer');
  });
});
