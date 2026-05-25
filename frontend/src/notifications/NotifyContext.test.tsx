import { ThemeProvider, createTheme } from '@mui/material';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ErrorBanner } from './ErrorBanner';
import { LoadingOverlay } from './LoadingOverlay';
import { NotifyProvider, useNotify } from './NotifyContext';

const theme = createTheme();

function wrap(ui: React.ReactNode) {
  return render(<ThemeProvider theme={theme}><NotifyProvider>{ui}</NotifyProvider></ThemeProvider>);
}

function Trigger() {
  const notify = useNotify();
  return (
    <>
      <button onClick={() => notify.success('All good!')}>success</button>
      <button onClick={() => notify.error('Something broke')}>error</button>
      <button onClick={() => notify.info('Heads up')}>info</button>
    </>
  );
}

describe('useNotify', () => {
  it('shows a success toast', async () => {
    wrap(<Trigger />);
    await userEvent.click(screen.getByRole('button', { name: 'success' }));
    expect(screen.getByText('All good!')).toBeInTheDocument();
  });

  it('shows an error toast', async () => {
    wrap(<Trigger />);
    await userEvent.click(screen.getByRole('button', { name: 'error' }));
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('shows an info toast', async () => {
    wrap(<Trigger />);
    await userEvent.click(screen.getByRole('button', { name: 'info' }));
    expect(screen.getByText('Heads up')).toBeInTheDocument();
  });
});

describe('LoadingOverlay', () => {
  it('renders a progressbar indicator when open', () => {
    wrap(<LoadingOverlay open />);
    // MUI Backdrop marks itself aria-hidden; use hidden:true to reach it
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    wrap(<LoadingOverlay open={false} />);
    expect(screen.queryByRole('progressbar', { hidden: true })).not.toBeInTheDocument();
  });
});

describe('ErrorBanner', () => {
  it('renders the message when provided', () => {
    render(<ThemeProvider theme={theme}><ErrorBanner message="Network error" /></ThemeProvider>);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders nothing when message is empty', () => {
    const { container } = render(
      <ThemeProvider theme={theme}><ErrorBanner message="" /></ThemeProvider>,
    );
    expect(container.firstChild).toBeNull();
  });
});
