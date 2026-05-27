import { z } from 'zod';
import type { CreateEmployeeInput } from '../../api/types';
import type { Employee } from '../../api/types';

/** UI form schema — annual salary in US dollars (stored as cents). */
export const employeeFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  jobTitle: z.string().min(1, 'Job title is required'),
  country: z.string().length(2, 'Must be a 2-letter country code').toUpperCase(),
  department: z.string().min(1, 'Department is required'),
  salaryDollars: z
    .number({ invalid_type_error: 'Salary must be a number' })
    .positive('Salary must be greater than 0')
    .max(10_000_000, 'Salary is too large'),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

export type EmployeeFormUiValues = z.infer<typeof employeeFormSchema>;

export function formToApiInput(values: EmployeeFormUiValues): CreateEmployeeInput {
  const { salaryDollars, ...rest } = values;
  return {
    ...rest,
    salaryCents: Math.round(salaryDollars * 100),
    currency: 'USD',
  };
}

export function employeeToFormDefaults(emp: Employee): EmployeeFormUiValues {
  return {
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    jobTitle: emp.jobTitle,
    country: emp.country,
    department: emp.department,
    salaryDollars: emp.salaryCents / 100,
    hireDate: emp.hireDate.slice(0, 10),
  };
}
