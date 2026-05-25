import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataTable, type Column } from '../components/DataTable';
import { useEmployees } from '../api/hooks';
import type { Employee } from '../api/types';
import { DeleteEmployeeDialog } from '../features/employees/DeleteEmployeeDialog';
import { EmployeeFormDialog } from '../features/employees/EmployeeFormDialog';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSalary(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toLocaleString()}`;
  }
}

// ── Column definitions (actions injected by the page component) ──────────────

const BASE_COLUMNS: Column<Employee>[] = [
  {
    key: 'fullName',
    label: 'Name',
    sortable: true,
    render: (v, row) => (
      <Link
        to={`/employees/${row.id}`}
        style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}
        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
      >
        {v as string}
      </Link>
    ),
  },
  {
    key: 'email',
    label: 'Email',
  },
  {
    key: 'jobTitle',
    label: 'Job Title',
    sortable: true,
  },
  {
    key: 'country',
    label: 'Country',
    sortable: true,
  },
  {
    key: 'department',
    label: 'Department',
  },
  {
    key: 'salaryCents',
    label: 'Salary',
    sortable: true,
    render: (v, row) => formatSalary(v as number, row.currency),
  },
  {
    key: 'hireDate',
    label: 'Hire Date',
    sortable: true,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>();
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | undefined>();

  const page = Number(searchParams.get('page') ?? 1);
  const pageSize = Number(searchParams.get('pageSize') ?? 20);
  const country = searchParams.get('country') ?? '';
  const jobTitle = searchParams.get('jobTitle') ?? '';
  const q = searchParams.get('q') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'full_name';
  const sortDir = (searchParams.get('sortDir') ?? 'asc') as 'asc' | 'desc';

  const COLUMNS: Column<Employee>[] = [
    ...BASE_COLUMNS,
    {
      key: 'id',
      label: '',
      render: (_v, row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => setEditEmployee(row)}>
              <EditIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteEmployee(row)}>
              <DeleteIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const { data, isPending } = useEmployees({
    page,
    pageSize,
    country: country || undefined,
    jobTitle: jobTitle || undefined,
    q: q || undefined,
    sortBy,
    sortDir,
  });

  function setParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      // Reset to page 1 whenever a filter changes
      if (key !== 'page' && key !== 'pageSize') next.delete('page');
      return next;
    });
  }

  function handleSort(key: string, dir: 'asc' | 'desc') {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('sortBy', key);
      next.set('sortDir', dir);
      next.delete('page');
      return next;
    });
  }

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6">Employees</Typography>
          <Typography variant="body2" color="text.secondary">
            {data ? `${data.total.toLocaleString()} total` : '—'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
        >
          Add Employee
        </Button>
      </Box>

      <EmployeeFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EmployeeFormDialog
        open={Boolean(editEmployee)}
        employee={editEmployee}
        onClose={() => setEditEmployee(undefined)}
      />
      {deleteEmployee && (
        <DeleteEmployeeDialog
          open
          employeeId={deleteEmployee.id}
          employeeName={deleteEmployee.fullName}
          onClose={() => setDeleteEmployee(undefined)}
        />
      )}

      <Divider />

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <Stack direction="row" spacing={1.5} flexWrap="wrap">
        <OutlinedInput
          size="small"
          placeholder="Search name…"
          value={q}
          onChange={(e) => setParam('q', e.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </InputAdornment>
          }
          sx={{ minWidth: 200, fontSize: 13 }}
        />
        <TextField
          size="small"
          placeholder="Country"
          value={country}
          onChange={(e) => setParam('country', e.target.value)}
          inputProps={{ 'aria-label': 'country filter' }}
          sx={{ minWidth: 120, '& input': { fontSize: 13 } }}
        />
        <TextField
          size="small"
          placeholder="Job title"
          value={jobTitle}
          onChange={(e) => setParam('jobTitle', e.target.value)}
          inputProps={{ 'aria-label': 'job title filter' }}
          sx={{ minWidth: 160, '& input': { fontSize: 13 } }}
        />
      </Stack>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {isPending ? (
        <Stack spacing={1}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
          ))}
        </Stack>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={data?.data ?? []}
          total={data?.total ?? 0}
          page={page}
          pageSize={pageSize}
          onPageChange={(p) => setParam('page', String(p))}
          onSort={handleSort}
          sortBy={sortBy}
          sortDir={sortDir}
          rowsPerPageOptions={[10, 20, 50]}
        />
      )}
    </Box>
  );
}
