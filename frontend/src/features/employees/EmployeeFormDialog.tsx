import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  DialogActions,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormDialog } from '../../components/FormDialog';
import { useCreateEmployee, useUpdateEmployee } from '../../api/hooks';
import { ApiResponseError, type Employee } from '../../api/types';
import { COUNTRIES, findCountry, type Country } from './countries';
import { employeeSchema, type EmployeeFormValues } from './employeeSchema';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert an ISO datetime string (or plain date) to YYYY-MM-DD for <input type="date">. */
function toDateInputValue(value: string | undefined): string {
  if (!value) return '';
  // Handles both "2024-01-15" and "2024-01-15T00:00:00Z"
  return value.slice(0, 10);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pass an existing employee to enter edit mode. */
  employee?: Employee;
}

export function EmployeeFormDialog({ open, onClose, employee }: Props) {
  const isEdit = Boolean(employee);

  function buildDefaults(emp?: Employee): Partial<EmployeeFormValues> {
    if (!emp) return { currency: 'USD' };
    return {
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      jobTitle: emp.jobTitle,
      country: emp.country,
      department: emp.department,
      salaryCents: emp.salaryCents,
      currency: emp.currency,
      hireDate: toDateInputValue(emp.hireDate),
    };
  }

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: buildDefaults(employee),
  });

  // Re-populate when the dialog opens or the employee changes
  useEffect(() => {
    if (open) reset(buildDefaults(employee));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee?.id]);

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee(employee?.id ?? '');

  async function onSubmit(values: EmployeeFormValues) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(values);
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiResponseError && err.status === 409) {
        setError('email', { message: err.error.message });
      }
    }
  }

  const mutationError =
    createMutation.error instanceof ApiResponseError && createMutation.error.status !== 409
      ? createMutation.error.message
      : updateMutation.error instanceof ApiResponseError && updateMutation.error.status !== 409
        ? updateMutation.error.message
        : null;

  return (
    <FormDialog title={isEdit ? 'Edit Employee' : 'Add Employee'} open={open} onClose={onClose}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {mutationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {mutationError}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* ── Name ─────────────────────────────────────────────── */}
          <Grid item xs={6}>
            <TextField
              label="First Name"
              fullWidth
              size="small"
              {...register('firstName')}
              error={Boolean(errors.firstName)}
              helperText={errors.firstName?.message}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Last Name"
              fullWidth
              size="small"
              {...register('lastName')}
              error={Boolean(errors.lastName)}
              helperText={errors.lastName?.message}
            />
          </Grid>

          {/* ── Contact ──────────────────────────────────────────── */}
          <Grid item xs={12}>
            <TextField
              label="Email"
              fullWidth
              size="small"
              type="email"
              {...register('email')}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />
          </Grid>

          {/* ── Role ─────────────────────────────────────────────── */}
          <Grid item xs={6}>
            <TextField
              label="Job Title"
              fullWidth
              size="small"
              {...register('jobTitle')}
              error={Boolean(errors.jobTitle)}
              helperText={errors.jobTitle?.message}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Department"
              fullWidth
              size="small"
              {...register('department')}
              error={Boolean(errors.department)}
              helperText={errors.department?.message}
            />
          </Grid>

          {/* ── Country dropdown ─────────────────────────────────── */}
          <Grid item xs={12}>
            <Controller
              name="country"
              control={control}
              render={({ field }) => {
                const selected = field.value ? (findCountry(field.value) ?? null) : null;
                return (
                  <Autocomplete<Country>
                    options={COUNTRIES}
                    value={selected}
                    getOptionLabel={(o) => `${o.name} (${o.code})`}
                    isOptionEqualToValue={(o, v) => o.code === v.code}
                    onChange={(_e, option) => field.onChange(option?.code ?? '')}
                    onBlur={field.onBlur}
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
                        label="Country"
                        size="small"
                        inputProps={{ ...params.inputProps, 'aria-label': 'country' }}
                        error={Boolean(errors.country)}
                        helperText={errors.country?.message}
                      />
                    )}
                  />
                );
              }}
            />
          </Grid>

          {/* ── Compensation ─────────────────────────────────────── */}
          <Grid item xs={8}>
            <TextField
              label="Salary (cents)"
              fullWidth
              size="small"
              type="number"
              {...register('salaryCents', { valueAsNumber: true })}
              error={Boolean(errors.salaryCents)}
              helperText={errors.salaryCents?.message}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Currency"
              fullWidth
              size="small"
              placeholder="USD"
              inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }}
              {...register('currency')}
              error={Boolean(errors.currency)}
              helperText={errors.currency?.message}
            />
          </Grid>

          {/* ── Hire date ────────────────────────────────────────── */}
          <Grid item xs={12}>
            <TextField
              label="Joining Date"
              fullWidth
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              {...register('hireDate')}
              error={Boolean(errors.hireDate)}
              helperText={errors.hireDate?.message}
            />
          </Grid>
        </Grid>

        <DialogActions sx={{ px: 0, pb: 0, pt: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Box>
    </FormDialog>
  );
}
