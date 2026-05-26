import { ThemeProvider, createTheme } from '@mui/material';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type Column } from './DataTable';

const theme = createTheme();

interface Row {
  id: string;
  name: string;
  age: number;
}

const columns: Column<Row>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'age', label: 'Age' },
];

const rows: Row[] = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
];

function wrap(ui: React.ReactNode) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('DataTable', () => {
  it('renders column headers', () => {
    wrap(
      <DataTable
        columns={columns}
        rows={rows}
        total={2}
        page={1}
        pageSize={20}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('renders all row values', () => {
    wrap(
      <DataTable
        columns={columns}
        rows={rows}
        total={2}
        page={1}
        pageSize={20}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('calls onPageChange when next page is clicked', async () => {
    const onPageChange = vi.fn();
    wrap(
      <DataTable
        columns={columns}
        rows={rows}
        total={40}
        page={1}
        pageSize={20}
        onPageChange={onPageChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onSort when a sortable header is clicked', async () => {
    const onSort = vi.fn();
    wrap(
      <DataTable
        columns={columns}
        rows={rows}
        total={2}
        page={1}
        pageSize={20}
        onPageChange={vi.fn()}
        onSort={onSort}
      />,
    );
    await userEvent.click(screen.getByText('Name'));
    expect(onSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('toggles sort direction on second click', async () => {
    const onSort = vi.fn();
    wrap(
      <DataTable
        columns={columns}
        rows={rows}
        total={2}
        page={1}
        pageSize={20}
        onPageChange={vi.fn()}
        onSort={onSort}
        sortBy="name"
        sortDir="asc"
      />,
    );
    await userEvent.click(screen.getByText('Name'));
    expect(onSort).toHaveBeenCalledWith('name', 'desc');
  });
});
