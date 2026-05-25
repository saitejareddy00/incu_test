import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  DialogActions,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { FormDialog } from '../../components/FormDialog';
import { useCreateEmployee, useUpdateEmployee } from '../../api/hooks';
import { ApiResponseError, type Employee } from '../../api/types';
import { formatSalaryCents } from '../../utils/formatSalary';
import { avatarColor, initials } from './avatarUtils';
import { COUNTRIES, findCountry, type Country } from './countries';
import { employeeSchema, type EmployeeFormValues } from './employeeSchema';

function toDateInputValue(value: string | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function FormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(99, 102, 241, 0.1)',
            color: 'secondary.main',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>
      {children}
    </Box>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
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

  const firstName = useWatch({ control, name: 'firstName' }) ?? '';
  const lastName = useWatch({ control, name: 'lastName' }) ?? '';
  const salaryCents = useWatch({ control, name: 'salaryCents' });
  const currency = useWatch({ control, name: 'currency' }) ?? 'USD';

  const previewName = [firstName, lastName].filter(Boolean).join(' ') || 'New employee';
  const salaryPreview =
    typeof salaryCents === 'number' && salaryCents > 0
      ? formatSalaryCents(salaryCents, currency || 'USD')
      : null;

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
    <FormDialog
      title={isEdit ? 'Edit Employee' : 'Add Employee'}
      subtitle={
        isEdit
          ? 'Update profile, role, and compensation details.'
          : 'Create a new team member with role and pay information.'
      }
      open={open}
      onClose={onClose}
      maxWidth="md"
      headerVariant="gradient"
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'rgba(99, 102, 241, 0.04)',
            borderColor: 'rgba(99, 102, 241, 0.15)',
          }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              fontSize: 16,
              fontWeight: 700,
              bgcolor: avatarColor(previewName),
            }}
          >
            {initials(previewName)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
              {previewName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {salaryPreview
                ? `Compensation preview: ${salaryPreview}`
                : 'Preview updates as you fill in the form'}
            </Typography>
          </Box>
        </Paper>

        {mutationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {mutationError}
          </Alert>
        )}

        <FormSection
          title="Personal details"
          description="Name and contact information"
          icon={<AccountCircleOutlinedIcon fontSize="small" />}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                fullWidth
                size="small"
                {...register('firstName')}
                error={Boolean(errors.firstName)}
                helperText={errors.firstName?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
                placeholder="name@company.com"
                {...register('email')}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
            </Grid>
          </Grid>
        </FormSection>

        <Divider sx={{ mb: 3 }} />

        <FormSection
          title="Role & location"
          description="Job, department, and country"
          icon={<WorkOutlineOutlinedIcon fontSize="small" />}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Job Title"
                fullWidth
                size="small"
                placeholder="e.g. Software Engineer"
                {...register('jobTitle')}
                error={Boolean(errors.jobTitle)}
                helperText={errors.jobTitle?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Department"
                fullWidth
                size="small"
                placeholder="e.g. Engineering"
                {...register('department')}
                error={Boolean(errors.department)}
                helperText={errors.department?.message}
              />
            </Grid>
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
            <Grid item xs={12}>
              <TextField
                label="Joining Date"
                fullWidth
                size="small"
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register('hireDate')}
                error={Boolean(errors.hireDate)}
                helperText={errors.hireDate?.message ?? 'Used for tenure and reporting'}
              />
            </Grid>
          </Grid>
        </FormSection>

        <Divider sx={{ mb: 3 }} />

        <FormSection
          title="Compensation"
          description="Salary stored in cents for precision"
          icon={<AttachMoneyOutlinedIcon fontSize="small" />}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Salary (cents)"
                fullWidth
                size="small"
                type="number"
                placeholder="12000000"
                {...register('salaryCents', { valueAsNumber: true })}
                error={Boolean(errors.salaryCents)}
                helperText={
                  errors.salaryCents?.message ??
                  (salaryPreview ? `Displays as ${salaryPreview}` : 'Enter amount in cents')
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
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
          </Grid>
        </FormSection>

        <DialogActions
          sx={{
            px: 0,
            pb: 0,
            pt: 1,
            borderTop: 1,
            borderColor: 'divider',
            mt: 1,
          }}
        >
          <Button onClick={onClose} disabled={isSubmitting} color="inherit">
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
