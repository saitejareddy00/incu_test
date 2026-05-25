import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { NotifyProvider } from '../../notifications/NotifyContext';
import { DeleteEmployeeDialog } from './DeleteEmployeeDialog';

const theme = createTheme();

const server = setupServer(
  http.delete('/api/employees/:id', () => new HttpResponse(null, { status: 204 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={qc}>
        <NotifyProvider>{ui}</NotifyProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe('DeleteEmployeeDialog', () => {
  it('renders employee name in the confirmation message', () => {
    wrap(
      <DeleteEmployeeDialog
        open employeeId="1" employeeName="Alice Smith"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/alice smith/i)).toBeInTheDocument();
  });

  it('calls DELETE and closes dialog on confirm', async () => {
    const onClose = vi.fn();
    wrap(
      <DeleteEmployeeDialog
        open employeeId="1" employeeName="Alice Smith"
        onClose={onClose}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /confirm|delete/i }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('does NOT call DELETE when cancel is clicked', async () => {
    let deleteCalled = false;
    server.use(
      http.delete('/api/employees/:id', () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const onClose = vi.fn();
    wrap(
      <DeleteEmployeeDialog
        open employeeId="1" employeeName="Alice Smith"
        onClose={onClose}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(deleteCalled).toBe(false);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an error toast on delete failure', async () => {
    server.use(
      http.delete('/api/employees/:id', () =>
        HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 }),
      ),
    );
    wrap(
      <DeleteEmployeeDialog
        open employeeId="1" employeeName="Alice Smith"
        onClose={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /confirm|delete/i }));
    await waitFor(() => expect(screen.getByText(/not found/i)).toBeInTheDocument());
  });
});
