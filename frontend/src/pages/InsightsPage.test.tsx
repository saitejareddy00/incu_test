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
const ENGINEER_STATS = { avg: 110_000, count: 3 };
const MANAGER_STATS = { avg: 150_000, count: 2 };

const server = setupServer(
  http.get('/api/insights/country/US', () => HttpResponse.json(US_STATS)),
  http.get('/api/insights/country/GB', () => HttpResponse.json(GB_STATS)),
  http.get('/api/insights/job-titles', ({ request }) => {
    const country = new URL(request.url).searchParams.get('country');
    if (country === 'US') {
      return HttpResponse.json({ jobTitles: ['Engineer', 'Manager'] });
    }
    return HttpResponse.json({ jobTitles: [] });
  }),
  http.get('/api/insights/country/US/job-title/Engineer', () =>
    HttpResponse.json(ENGINEER_STATS),
  ),
  http.get('/api/insights/country/US/job-title/Manager', () =>
    HttpResponse.json(MANAGER_STATS),
  ),
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

async function waitForCountryOverview() {
  await waitFor(() => expect(screen.getByText(/country overview/i)).toBeInTheDocument());
  await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument());
}

describe('InsightsPage — country view', () => {
  it('renders country overview with KPI cards for the country in the URL', async () => {
    renderPage('/insights?country=US');
    await waitForCountryOverview();
    expect(screen.getByText(/headcount/i)).toBeInTheDocument();
    expect(screen.getAllByText(/minimum/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/median/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/salary distribution/i)).toBeInTheDocument();
  });

  it('re-fetches country stats when country selector changes', async () => {
    renderPage('/insights?country=US');
    await waitForCountryOverview();

    const countryInput = screen.getByRole('combobox', { name: /country/i });
    await userEvent.clear(countryInput);
    await userEvent.type(countryInput, 'United Kingdom');
    await userEvent.click(await screen.findByText(/united kingdom/i));

    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
    expect(screen.queryByText('10')).not.toBeInTheDocument();
  });

  it('shows empty state until a country is selected', async () => {
    renderPage('/insights');
    expect(screen.getByText(/select a market to analyze/i)).toBeInTheDocument();
    expect(screen.getByText(/choose a country above/i)).toBeInTheDocument();
  });

  it('renders role chips disabled until country is selected', async () => {
    renderPage('/insights');
    const allRoles = screen.getByRole('button', { name: /all roles/i });
    expect(allRoles).toHaveAttribute('aria-disabled', 'true');
  });

  it('loads role chips after country is selected', async () => {
    renderPage('/insights?country=US');
    await waitForCountryOverview();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Engineer' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Manager' })).toBeInTheDocument();
  });
});

describe('InsightsPage — country + job title view', () => {
  it('shows country overview and role focus when both are selected', async () => {
    renderPage('/insights?country=US&jobTitle=Engineer');
    await waitForCountryOverview();
    await waitFor(() => expect(screen.getByText(/role focus — engineer/i)).toBeInTheDocument());
    expect(screen.getAllByText(/3 employees/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/vs country average/i).length).toBeGreaterThan(0);
  });

  it('shows role focus when a role chip is clicked', async () => {
    renderPage('/insights?country=US');
    await waitForCountryOverview();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Manager' })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Manager' }));

    await waitFor(() => expect(screen.getByText(/role focus — manager/i)).toBeInTheDocument());
    expect(screen.getAllByText(/2 employees/i).length).toBeGreaterThan(0);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('updates the URL when a role chip is selected', async () => {
    const router = renderPage('/insights?country=US');
    await waitForCountryOverview();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Engineer' })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Engineer' }));

    await waitFor(() => expect(router.state.location.search).toContain('jobTitle=Engineer'));
  });
});
