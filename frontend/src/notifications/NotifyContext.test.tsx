import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NotifyProvider, useNotify } from './NotifyContext';

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

function setup() {
  render(
    <NotifyProvider>
      <Trigger />
    </NotifyProvider>,
  );
}

describe('useNotify', () => {
  it('shows a success toast', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'success' }));
    expect(screen.getByText('All good!')).toBeInTheDocument();
  });

  it('shows an error toast', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'error' }));
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('shows an info toast', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'info' }));
    expect(screen.getByText('Heads up')).toBeInTheDocument();
  });
});

describe('LoadingOverlay', () => {
  it('renders an accessible busy indicator when open', () => {
    const { rerender } = render(
      <NotifyProvider>
        <div />
      </NotifyProvider>,
    );
    // import lazily to avoid circular dep in test
    const { LoadingOverlay } = require('./LoadingOverlay') as typeof import('./LoadingOverlay');
    rerender(
      <NotifyProvider>
        <LoadingOverlay open />
      </NotifyProvider>,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { LoadingOverlay } = require('./LoadingOverlay') as typeof import('./LoadingOverlay');
    render(
      <NotifyProvider>
        <LoadingOverlay open={false} />
      </NotifyProvider>,
    );
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

describe('ErrorBanner', () => {
  it('renders the message when provided', () => {
    const { ErrorBanner } = require('./ErrorBanner') as typeof import('./ErrorBanner');
    render(<ErrorBanner message="Network error" />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders nothing when message is empty', () => {
    const { ErrorBanner } = require('./ErrorBanner') as typeof import('./ErrorBanner');
    const { container } = render(<ErrorBanner message="" />);
    expect(container.firstChild).toBeNull();
  });
});

// Suppress act() warnings for the dismiss-timer in Snackbar
void act(() => Promise.resolve());
