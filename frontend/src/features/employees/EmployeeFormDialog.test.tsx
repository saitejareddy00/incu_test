import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { EmployeeFormDialog } from './EmployeeFormDialog';
import type { Employee } from '../../api/types';

const theme = createTheme();

const server = setupServer(
  http.post('/api/employees', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(
      { id: 'new-1', ...body, fullName: `${body.firstName} ${body.lastName}` },
      { status: 201 },
    );
  }),
  http.patch('/api/employees/:id', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: 'emp-1', ...body });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </ThemeProvider>,
  );
}

const existingEmployee: Employee = {
  id: 'emp-1', firstName: 'Alice', lastName: 'Smith', fullName: 'Alice Smith',
  email: 'alice@example.com', jobTitle: 'Engineer', country: 'US',
  department: 'Engineering', salaryCents: 120_000, currency: 'USD',
  hireDate: '2024-01-15', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z',
};

const validInput = {
  firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com',
  jobTitle: 'Engineer', country: 'US', department: 'Engineering',
  salaryCents: 120000, currency: 'USD', hireDate: '2024-01-15',
};

async function fillForm(overrides: Partial<typeof validInput> = {}) {
  const values = { ...validInput, ...overrides };
  await userEvent.type(screen.getByLabelText(/first name/i), values.firstName);
  await userEvent.type(screen.getByLabelText(/last name/i), values.lastName);
  await userEvent.type(screen.getByLabelText(/email/i), values.email);
  await userEvent.type(screen.getByLabelText(/job title/i), values.jobTitle);
  await userEvent.type(screen.getByLabelText(/country/i), values.country);
  await userEvent.type(screen.getByLabelText(/department/i), values.department);
  await userEvent.type(screen.getByLabelText(/salary/i), String(values.salaryCents));
  await userEvent.type(screen.getByLabelText(/currency/i), values.currency);
  await userEvent.type(screen.getByLabelText(/hire date/i), values.hireDate);
}

// ── Create mode ───────────────────────────────────────────────────────────────

describe('EmployeeFormDialog — create mode', () => {
  it('renders all required fields when open', () => {
    wrap(<EmployeeFormDialog open onClose={vi.fn()} />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/salary/i)).toBeInTheDocument();
  });

  it('shows validation error for empty required fields on submit', async () => {
    const onClose = vi.fn();
    wrap(<EmployeeFormDialog open onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument(),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls POST and closes dialog on valid submit', async () => {
    const onClose = vi.fn();
    wrap(<EmployeeFormDialog open onClose={onClose} />);
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('shows a 409 conflict as an email field error', async () => {
    server.use(
      http.post('/api/employees', () =>
        HttpResponse.json(
          { error: { code: 'CONFLICT', message: "Email 'alice@example.com' is already taken" } },
          { status: 409 },
        ),
      ),
    );
    wrap(<EmployeeFormDialog open onClose={vi.fn()} />);
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(screen.getByText(/already taken/i)).toBeInTheDocument());
  });
});

// ── Edit mode ─────────────────────────────────────────────────────────────────

describe('EmployeeFormDialog — edit mode', () => {
  it('shows "Edit Employee" as title', () => {
    wrap(<EmployeeFormDialog open onClose={vi.fn()} employee={existingEmployee} />);
    expect(screen.getByText('Edit Employee')).toBeInTheDocument();
  });

  it('pre-populates fields with existing employee values', () => {
    wrap(<EmployeeFormDialog open onClose={vi.fn()} employee={existingEmployee} />);
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Alice');
    expect(screen.getByLabelText(/email/i)).toHaveValue('alice@example.com');
  });

  it('calls PATCH and closes on valid submit', async () => {
    const onClose = vi.fn();
    wrap(<EmployeeFormDialog open onClose={onClose} employee={existingEmployee} />);
    const jobField = screen.getByLabelText(/job title/i);
    await userEvent.clear(jobField);
    await userEvent.type(jobField, 'Senior Engineer');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('surfaces 409 email conflict as field error in edit mode', async () => {
    server.use(
      http.patch('/api/employees/:id', () =>
        HttpResponse.json(
          { error: { code: 'CONFLICT', message: 'Email is already taken' } },
          { status: 409 },
        ),
      ),
    );
    wrap(<EmployeeFormDialog open onClose={vi.fn()} employee={existingEmployee} />);
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(screen.getByText(/already taken/i)).toBeInTheDocument());
  });
});
