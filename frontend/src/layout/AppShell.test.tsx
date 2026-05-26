import { ThemeProvider, createTheme } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AppShell from './AppShell';

const theme = createTheme();

function renderShell(initialPath = '/') {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppShell />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('AppShell', () => {
  it('renders the app title in the sidebar', () => {
    renderShell();
    expect(screen.getByText('Salary Management')).toBeInTheDocument();
  });

  it('renders navigation links for all four routes', () => {
    renderShell();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /employees/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /insights/i })).toBeInTheDocument();
  });

  it('Dashboard link points to /', () => {
    renderShell();
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/');
  });

  it('Employees link points to /employees', () => {
    renderShell();
    expect(screen.getByRole('link', { name: /employees/i })).toHaveAttribute('href', '/employees');
  });

  it('Insights link points to /insights', () => {
    renderShell();
    expect(screen.getByRole('link', { name: /insights/i })).toHaveAttribute('href', '/insights');
  });
});
