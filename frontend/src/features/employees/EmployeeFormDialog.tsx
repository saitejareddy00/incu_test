import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, DialogActions, Grid, TextField } from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormDialog } from '../../components/FormDialog';
import { useCreateEmployee, useUpdateEmployee } from '../../api/hooks';
import { ApiResponseError, type Employee } from '../../api/types';
import { employeeSchema, type EmployeeFormValues } from './employeeSchema';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pass an existing employee to enter edit mode. */
  employee?: Employee;
}

export function EmployeeFormDialog({ open, onClose, employee }: Props) {
  const isEdit = Boolean(employee);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? {
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          jobTitle: employee.jobTitle,
          country: employee.country,
          department: employee.department,
          salaryCents: employee.salaryCents,
          currency: employee.currency,
          hireDate: employee.hireDate,
        }
      : { currency: 'USD' },
  });

  // Re-populate when employee prop changes (e.g. opening edit for different row)
  useEffect(() => {
    if (open) {
      reset(
        employee
          ? {
              firstName: employee.firstName,
              lastName: employee.lastName,
              email: employee.email,
              jobTitle: employee.jobTitle,
              country: employee.country,
              department: employee.department,
              salaryCents: employee.salaryCents,
              currency: employee.currency,
              hireDate: employee.hireDate,
            }
          : { currency: 'USD' },
      );
    }
  }, [open, employee, reset]);

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
          <Grid item xs={4}>
            <TextField
              label="Country"
              fullWidth
              size="small"
              placeholder="US"
              inputProps={{ maxLength: 2 }}
              {...register('country')}
              error={Boolean(errors.country)}
              helperText={errors.country?.message}
            />
          </Grid>
          <Grid item xs={4}>
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
              inputProps={{ maxLength: 3 }}
              {...register('currency')}
              error={Boolean(errors.currency)}
              helperText={errors.currency?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Hire Date"
              fullWidth
              size="small"
              placeholder="YYYY-MM-DD"
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
