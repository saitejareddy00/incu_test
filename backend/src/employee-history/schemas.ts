import { z } from 'zod';

const nonBlankString = z.string().min(1, 'Must not be blank');
const positiveCents = z.number().int().positive('salary_cents must be > 0');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a YYYY-MM-DD date');

export const CreateHistoryInputSchema = z.object({
  employeeId: z.string().uuid(),
  salaryCents: positiveCents,
  jobTitle: nonBlankString,
  effectiveFrom: isoDate,
  effectiveTo: isoDate.nullable(),
});

export type CreateHistoryInput = z.infer<typeof CreateHistoryInputSchema>;

export const EmployeeHistoryRowSchema = z.object({
  id: z.string().uuid(),
  employeeId: z.string().uuid(),
  salaryCents: positiveCents,
  jobTitle: nonBlankString,
  effectiveFrom: isoDate,
  effectiveTo: isoDate.nullable(),
  createdAt: z.date(),
  fullName: z.string(),
  email: z.string().email(),
});

export type EmployeeHistoryRow = z.infer<typeof EmployeeHistoryRowSchema>;
