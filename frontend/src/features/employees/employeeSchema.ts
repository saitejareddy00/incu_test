import { z } from 'zod';

export const employeeSchema = z.object({
  firstName:   z.string().min(1, 'First name is required'),
  lastName:    z.string().min(1, 'Last name is required'),
  email:       z.string().email('Invalid email address'),
  jobTitle:    z.string().min(1, 'Job title is required'),
  country:     z.string().length(2, 'Must be a 2-letter country code').toUpperCase(),
  department:  z.string().min(1, 'Department is required'),
  salaryCents: z
    .number({ invalid_type_error: 'Salary must be a number' })
    .int('Salary must be a whole number')
    .positive('Salary must be greater than 0'),
  currency:    z.string().length(3, 'Must be a 3-letter currency code').toUpperCase(),
  hireDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

/** Partial version used by the edit form. */
export const updateEmployeeSchema = employeeSchema.partial();
export type UpdateEmployeeFormValues = z.infer<typeof updateEmployeeSchema>;
