import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NotifyProvider } from '../notifications/NotifyContext';
import EmployeeDetailPage from './EmployeeDetailPage';

const theme = createTheme();

const EMPLOYEE = {
  id: 'emp-1', firstName: 'Alice', lastName: 'Smith', fullName: 'Alice Smith',
  email: 'alice@example.com', jobTitle: 'Engineer', country: 'US',
  department: 'Engineering', salaryCents: 120_000, currency: 'USD',
  hireDate: '2024-01-15', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z',
  isDeleted: false, deletedAt: null,
};

const server = setupServer(
  http.get('/api/employees/:id', ({ params }) => {
    if (params.id === 'emp-1') return HttpResponse.json(EMPLOYEE);
    return HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Employee not found' } },
      { status: 404 },
    );
  }),
  http.delete('/api/employees/:id', () => new HttpResponse(null, { status: 204 })),
  http.patch('/api/employees/:id', () => HttpResponse.json(EMPLOYEE)),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage(id = 'emp-1') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={qc}>
        <NotifyProvider>
          <MemoryRouter initialEntries={[`/employees/${id}`]}>
            <Routes>
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/employees" element={<div>List page</div>} />
            </Routes>
          </MemoryRouter>
        </NotifyProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe('EmployeeDetailPage', () => {
  it('renders all employee fields after load', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeInTheDocument());
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText(/engineer/i)).toBeInTheDocument();
  });

  it('renders a back link to the employee list', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Alice Smith'));
    expect(screen.getByRole('link', { name: /employees/i })).toHaveAttribute('href', '/employees');
  });

  it('renders Edit and Delete action buttons', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Alice Smith'));
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('shows a 404 message for an unknown employee', async () => {
    renderPage('does-not-exist');
    await waitFor(() =>
      expect(screen.getByText(/not found/i)).toBeInTheDocument(),
    );
  });
});
