import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import GroupsIcon from '@mui/icons-material/Groups';
import SearchIcon from '@mui/icons-material/Search';
import { Link } from 'react-router-dom';
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { DataTable, TableLoadingSkeleton, type Column } from '../components/DataTable';
import { KpiCard } from '../components/KpiCard';
import { useEmployees } from '../api/hooks';
import type { Employee } from '../api/types';
import { DeleteEmployeeDialog } from '../features/employees/DeleteEmployeeDialog';
import { avatarColor, initials } from '../features/employees/avatarUtils';
import { COUNTRIES, findCountry, type Country } from '../features/employees/countries';
import { EmployeeFormDialog } from '../features/employees/EmployeeFormDialog';
import { formatDate } from '../utils/formatDate';
import { formatSalaryCents } from '../utils/formatSalary';
import { buildInsightsPath } from '../utils/insightsLink';

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
              {row.isDeleted ? (
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  {name} (Deactivated)
                </Typography>
              ) : (
                name
              )}
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
    render: (v) => (
      <Typography variant="body2" sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
        {formatSalaryCents(v as number)}
      </Typography>
    ),
  },
  {
    key: 'hireDate',
    label: 'Hire Date',
    sortable: true,
    render: (v) => formatDate(v as string),
  },
];

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

export default function EmployeesPage() {
  const [listState, setListState] = useState<ListState>(DEFAULT_LIST_STATE);
  const [createOpen, setCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>();
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | undefined>();

  const { page, pageSize, country, jobTitle, q, sortBy, sortDir } = listState;

  const debouncedQ = useDebouncedValue(q, FILTER_DEBOUNCE_MS);
  const debouncedJobTitle = useDebouncedValue(jobTitle, FILTER_DEBOUNCE_MS);
  const debouncedPage = useDebouncedValue(page, FILTER_DEBOUNCE_MS);

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

  const { data, isPending, isFetching } = useEmployees({
    page: debouncedPage,
    pageSize,
    country: country || undefined,
    jobTitle: debouncedJobTitle || undefined,
    q: debouncedQ || undefined,
    sortBy,
    sortDir,
  });

  const activeFilterCount = [q, country, jobTitle].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0;
  const isInitialLoad = isPending && !data;
  const isTableLoading = isFetching && !isInitialLoad;

  const pageRangeLabel = useMemo(() => {
    if (!data || data.total === 0) return 'No results';
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, data.total);
    return `${start}–${end} of ${data.total.toLocaleString()}`;
  }, [data, page, pageSize]);

  function updateList(partial: Partial<ListState>, resetPage = false) {
    setListState((prev) => ({
      ...prev,
      ...partial,
      ...(resetPage ? { page: 1 } : {}),
    }));
  }

  function clearFilters() {
    setListState((prev) => ({
      ...prev,
      q: '',
      country: '',
      jobTitle: '',
      page: 1,
    }));
  }

  function handleSort(key: string, dir: 'asc' | 'desc') {
    updateList({ sortBy: key, sortDir: dir }, true);
  }

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%' }}>
      {/* Hero */}
      <Paper
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #111827 0%, #1e3a5f 50%, #312e81 100%)',
          color: '#f9fafb',
          borderRadius: 2,
          border: 'none',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: '#a5b4fc', letterSpacing: '0.12em' }}>
              Team directory
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mt: 0.5 }}>
              Employees
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af', mt: 1 }}>
              Search, filter, and manage compensation records across your organization.
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{
              flexShrink: 0,
              bgcolor: '#6366f1',
              '&:hover': { bgcolor: '#4f46e5' },
            }}
          >
            Add Employee
          </Button>
        </Box>
      </Paper>

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

      {/* Summary KPIs */}
      {!isInitialLoad && data && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <KpiCard
              label="Total employees"
              value={data.total.toLocaleString()}
              detail="Matching current filters"
              icon={<GroupsIcon fontSize="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <KpiCard
              label="This page"
              value={String(data.data.length)}
              detail={pageRangeLabel}
              icon={<FilterListIcon fontSize="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <KpiCard
              label="Active filters"
              value={String(activeFilterCount)}
              detail={hasFilters ? 'Refine or clear below' : 'Showing full directory'}
              icon={<SearchIcon fontSize="small" />}
              accent={hasFilters ? '#6366f1' : undefined}
            />
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Search & filters
          </Typography>
          {hasFilters && (
            <Button
              size="small"
              startIcon={<ClearAllIcon sx={{ fontSize: 16 }} />}
              onClick={clearFilters}
              sx={{ fontSize: 12 }}
            >
              Clear all
            </Button>
          )}
        </Box>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <OutlinedInput
            size="small"
            placeholder="Search name or email…"
            value={q}
            onChange={(e) => updateList({ q: e.target.value })}
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              </InputAdornment>
            }
            sx={{ flex: 1, minWidth: 200, fontSize: 13 }}
            inputProps={{ 'aria-label': 'search employees' }}
          />
          <Autocomplete<Country>
            size="small"
            options={COUNTRIES}
            value={country ? (findCountry(country) ?? null) : null}
            getOptionLabel={(o) => `${o.name} (${o.code})`}
            isOptionEqualToValue={(o, v) => o.code === v.code}
            onChange={(_e, option) => updateList({ country: option?.code ?? '' }, true)}
            sx={{ minWidth: 220, flex: 1, '& input': { fontSize: 13 } }}
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
            sx={{ minWidth: 160, flex: 1, '& input': { fontSize: 13 } }}
          />
        </Stack>

        {hasFilters && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
            {q && (
              <Chip
                label={`Search: ${q}`}
                size="small"
                onDelete={() => updateList({ q: '' }, true)}
              />
            )}
            {country && (
              <Chip
                label={`Country: ${country}`}
                size="small"
                onDelete={() => updateList({ country: '' }, true)}
              />
            )}
            {jobTitle && (
              <Chip
                label={`Role: ${jobTitle}`}
                size="small"
                onDelete={() => updateList({ jobTitle: '' }, true)}
              />
            )}
          </Stack>
        )}
      </Paper>

      {/* Insights drill-down */}
      {(country || debouncedJobTitle) && (
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            bgcolor: 'rgba(99, 102, 241, 0.04)',
            borderColor: 'rgba(99, 102, 241, 0.2)',
          }}
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" useFlexGap>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'secondary.main' }}>
              Compensation insights
            </Typography>
            {country && (
              <Chip
                component={Link}
                to={buildInsightsPath({ country })}
                clickable
                icon={<BarChartIcon sx={{ fontSize: 14 }} />}
                label={`View insights for ${country}`}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ fontSize: 12 }}
              />
            )}
            {debouncedJobTitle && (
              <Chip
                component={Link}
                to={buildInsightsPath({
                  country: country || undefined,
                  jobTitle: debouncedJobTitle,
                })}
                clickable
                icon={<BarChartIcon sx={{ fontSize: 14 }} />}
                label={`View insights for ${debouncedJobTitle}`}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ fontSize: 12 }}
              />
            )}
          </Stack>
        </Paper>
      )}

      {/* Table */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {isInitialLoad ? (
          <TableLoadingSkeleton pageSize={pageSize} columnCount={COLUMNS.length} />
        ) : (
          <DataTable
            columns={COLUMNS}
            rows={data?.data ?? []}
            total={data?.total ?? 0}
            page={page}
            pageSize={pageSize}
            loading={isTableLoading}
            onPageChange={(p) => updateList({ page: p })}
            onPageSizeChange={(size) => updateList({ pageSize: size, page: 1 })}
            onSort={handleSort}
            sortBy={sortBy}
            sortDir={sortDir}
            rowsPerPageOptions={[10, 20, 50]}
            getRowSx={(row) => (row.isDeleted ? DELETED_ROW_SX : undefined)}
          />
        )}
      </Box>
    </Box>
  );
}
