import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEmployee } from '../api/hooks';
import { ApiResponseError } from '../api/types';
import { DeleteEmployeeDialog } from '../features/employees/DeleteEmployeeDialog';
import { EmployeeFormDialog } from '../features/employees/EmployeeFormDialog';
import { formatDate } from '../utils/formatDate';
import { formatSalaryCents } from '../utils/formatSalary';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value ?? '—'}
      </Typography>
    </Box>
  );
}

export default function EmployeeDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: employee, isPending, error } = useEmployee(id);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isPending) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2, borderRadius: 1 }} />
      </Box>
    );
  }

  if (error) {
    const is404 = error instanceof ApiResponseError && error.status === 404;
    return (
      <Box sx={{ p: 3 }}>
        <Button
          component={Link}
          to="/employees"
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ mb: 2 }}
        >
          Employees
        </Button>
        <Alert severity={is404 ? 'warning' : 'error'}>
          {is404 ? 'Employee not found.' : error.message}
        </Alert>
      </Box>
    );
  }

  if (!employee) return null;

  return (
    <Box sx={{ p: 3, maxWidth: 800 }}>
      {/* ── Breadcrumb + actions ────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Button
          component={Link}
          to="/employees"
          startIcon={<ArrowBackIcon />}
          size="small"
          color="inherit"
          sx={{ color: 'text.secondary' }}
        >
          Employees
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">{employee.fullName}</Typography>
        <Typography variant="body2" color="text.secondary">
          {employee.jobTitle} · {employee.department}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* ── Detail grid ─────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Field label="Email" value={employee.email} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Field
              label="Country"
              value={<Chip label={employee.country} size="small" sx={{ fontSize: 11 }} />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Field label="Salary (USD)" value={formatSalaryCents(employee.salaryCents)} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <Field label="Hire Date" value={formatDate(employee.hireDate)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Field
              label="Employee ID"
              value={<code style={{ fontSize: 11 }}>{employee.id}</code>}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ── Dialogs ─────────────────────────────────────────────────── */}
      <EmployeeFormDialog open={editOpen} employee={employee} onClose={() => setEditOpen(false)} />
      <DeleteEmployeeDialog
        open={deleteOpen}
        employeeId={employee.id}
        employeeName={employee.fullName}
        onClose={() => {
          setDeleteOpen(false);
          void navigate('/employees');
        }}
      />
    </Box>
  );
}
