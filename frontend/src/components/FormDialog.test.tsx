import { ThemeProvider, createTheme } from '@mui/material';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FormDialog } from './FormDialog';

const theme = createTheme();

function wrap(ui: React.ReactNode) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('FormDialog', () => {
  it('renders the title and children when open', () => {
    wrap(
      <FormDialog title="Add Employee" open onClose={vi.fn()}>
        <p>Form content</p>
      </FormDialog>,
    );
    expect(screen.getByText('Add Employee')).toBeInTheDocument();
    expect(screen.getByText('Form content')).toBeInTheDocument();
  });

  it('does not show content when closed', () => {
    wrap(
      <FormDialog title="Add Employee" open={false} onClose={vi.fn()}>
        <p>Form content</p>
      </FormDialog>,
    );
    expect(screen.queryByText('Add Employee')).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    wrap(
      <FormDialog title="Test" open onClose={onClose}>
        <p>body</p>
      </FormDialog>,
    );
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
