import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
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

describe('InsightsPage — country view', () => {
  it('renders country-wide stat cards for the country in the URL', async () => {
    renderPage('/insights?country=US');
    await waitFor(() => expect(screen.getByText(/country-wide/i)).toBeInTheDocument());
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText(/minimum/i)).toBeInTheDocument();
    expect(screen.getByText(/median/i)).toBeInTheDocument();
  });

  it('re-fetches country stats when country selector changes', async () => {
    renderPage('/insights?country=US');
    await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument());

    const countryInput = screen.getByRole('combobox', { name: /country/i });
    await userEvent.clear(countryInput);
    await userEvent.type(countryInput, 'United Kingdom');
    await userEvent.click(await screen.findByText(/united kingdom/i));

    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
    expect(screen.queryByText('10')).not.toBeInTheDocument();
  });

  it('always renders job title dropdown, disabled until country is selected', async () => {
    renderPage('/insights');
    const jobInput = screen.getByLabelText(/job title/i);
    expect(jobInput).toBeDisabled();
    expect(screen.getByText(/filter by job title/i)).toBeInTheDocument();
  });

  it('enables job title dropdown after country is selected', async () => {
    renderPage('/insights?country=US');
    await waitFor(() => screen.getByText(/country-wide/i));
    expect(screen.getByLabelText(/job title/i)).not.toBeDisabled();
  });
});

describe('InsightsPage — country + job title view', () => {
  it('shows country-wide stats and job-title stats when both are selected', async () => {
    renderPage('/insights?country=US&jobTitle=Engineer');
    await waitFor(() => expect(screen.getByText(/country-wide/i)).toBeInTheDocument());
    expect(screen.getByText('10')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/engineer — in us/i)).toBeInTheDocument());
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getAllByText(/average salary/i).length).toBeGreaterThanOrEqual(1);
  });

  it('shows additional job-title insights below when selected from dropdown', async () => {
    renderPage('/insights?country=US');
    await waitFor(() => screen.getByText(/country-wide/i));

    const jobInput = screen.getByLabelText(/job title/i);
    await userEvent.click(jobInput);
    const listbox = await screen.findByRole('listbox');
    await userEvent.click(within(listbox).getByText('Manager'));

    await waitFor(() => expect(screen.getByText(/manager — in us/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('updates the URL when job title is selected from dropdown', async () => {
    const router = renderPage('/insights?country=US');
    await waitFor(() => screen.getByText(/country-wide/i));

    const jobInput = screen.getByLabelText(/job title/i);
    await userEvent.click(jobInput);
    const listbox = await screen.findByRole('listbox');
    await userEvent.click(within(listbox).getByText('Engineer'));

    await waitFor(() => expect(router.state.location.search).toContain('jobTitle=Engineer'));
  });
});
