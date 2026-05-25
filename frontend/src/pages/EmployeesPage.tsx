import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { Link } from 'react-router-dom';
import {
  Autocomplete,
  Avatar,
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
import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { DataTable, type Column } from '../components/DataTable';
import { useEmployees } from '../api/hooks';
import type { Employee } from '../api/types';
import { DeleteEmployeeDialog } from '../features/employees/DeleteEmployeeDialog';
import { COUNTRIES, findCountry, type Country } from '../features/employees/countries';
import { EmployeeFormDialog } from '../features/employees/EmployeeFormDialog';
import { formatDate } from '../utils/formatDate';

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#ef4444',
  '#14b8a6',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Column definitions (actions injected by the page component) ──────────────

const BASE_COLUMNS: Column<Employee>[] = [
  {
    key: 'fullName',
    label: 'Name',
    sortable: true,
    render: (v, row) => {
      const name = v as string;
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: 12,
              fontWeight: 600,
              bgcolor: avatarColor(name),
              flexShrink: 0,
            }}
          >
            {initials(name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Link
              to={`/employees/${row.id}`}
              style={{
                color: 'inherit',
                textDecoration: 'none',
                fontWeight: 500,
                display: 'block',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              {name}
            </Link>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.email}
            </Typography>
          </Box>
        </Box>
      );
    },
  },
  {
    key: 'jobTitle',
    label: 'Job Title',
    sortable: false,
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
    render: (v) => formatDate(v as string),
  },
];

// ── List state ────────────────────────────────────────────────────────────────

interface ListState {
  page: number;
  pageSize: number;
  country: string;
  jobTitle: string;
  q: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

const DEFAULT_LIST_STATE: ListState = {
  page: 1,
  pageSize: 10,
  country: '',
  jobTitle: '',
  q: '',
  sortBy: 'fullName',
  sortDir: 'asc',
};

const FILTER_DEBOUNCE_MS = 300;

const DELETED_ROW_SX = {
  bgcolor: 'rgba(239, 68, 68, 0.06)',
  '& .MuiTableCell-root': { color: 'text.secondary' },
  '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1) !important' },
} as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [listState, setListState] = useState<ListState>(DEFAULT_LIST_STATE);
  const [createOpen, setCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>();
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | undefined>();

  const { page, pageSize, country, jobTitle, q, sortBy, sortDir } = listState;

  const debouncedQ = useDebouncedValue(q, FILTER_DEBOUNCE_MS);
  const debouncedJobTitle = useDebouncedValue(jobTitle, FILTER_DEBOUNCE_MS);

  const filtersMounted = useRef(false);
  useEffect(() => {
    if (!filtersMounted.current) {
      filtersMounted.current = true;
      return;
    }
    setListState((prev) => ({ ...prev, page: 1 }));
  }, [debouncedQ, debouncedJobTitle]);

  const COLUMNS: Column<Employee>[] = [
    ...BASE_COLUMNS,
    {
      key: 'id',
      label: '',
      render: (_v, row) =>
        row.isDeleted ? null : (
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
    jobTitle: debouncedJobTitle || undefined,
    q: debouncedQ || undefined,
    sortBy,
    sortDir,
  });

  function updateList(partial: Partial<ListState>, resetPage = false) {
    setListState((prev) => ({
      ...prev,
      ...partial,
      ...(resetPage ? { page: 1 } : {}),
    }));
  }

  function handleSort(key: string, dir: 'asc' | 'desc') {
    updateList({ sortBy: key, sortDir: dir }, true);
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
          onChange={(e) => updateList({ q: e.target.value })}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </InputAdornment>
          }
          sx={{ minWidth: 200, fontSize: 13 }}
        />
        <Autocomplete<Country>
          size="small"
          options={COUNTRIES}
          value={country ? (findCountry(country) ?? null) : null}
          getOptionLabel={(o) => `${o.name} (${o.code})`}
          isOptionEqualToValue={(o, v) => o.code === v.code}
          onChange={(_e, option) => updateList({ country: option?.code ?? '' }, true)}
          sx={{ minWidth: 220, '& input': { fontSize: 13 } }}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.code}>
              <Typography
                variant="caption"
                sx={{
                  mr: 1.5,
                  minWidth: 28,
                  fontWeight: 600,
                  color: 'text.secondary',
                  fontFamily: 'monospace',
                }}
              >
                {option.code}
              </Typography>
              {option.name}
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Country"
              inputProps={{ ...params.inputProps, 'aria-label': 'country filter' }}
            />
          )}
        />
        <TextField
          size="small"
          placeholder="Job title"
          value={jobTitle}
          onChange={(e) => updateList({ jobTitle: e.target.value })}
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
          onPageChange={(p) => updateList({ page: p })}
          onSort={handleSort}
          sortBy={sortBy}
          sortDir={sortDir}
          rowsPerPageOptions={[10, 20, 50]}
          getRowSx={(row) => (row.isDeleted ? DELETED_ROW_SX : undefined)}
        />
      )}
    </Box>
  );
}
