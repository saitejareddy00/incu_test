import { z } from 'zod';

const nonBlankString = z.string().min(1, 'Must not be blank');
const positiveCents = z.number().int().positive('salary_cents must be > 0');
const isoDateTime = z.union([z.string().datetime(), z.date()]);

export const CreateHistoryInputSchema = z.object({
  employeeId: z.string().uuid(),
  salaryCents: positiveCents,
  jobTitle: nonBlankString,
  /** When omitted the DB default (now()) is used via clock_timestamp() at insert. */
  effectiveFrom: isoDateTime.optional(),
  effectiveTo: isoDateTime.nullable().optional(),
});

export type CreateHistoryInput = z.infer<typeof CreateHistoryInputSchema>;

export const EmployeeHistoryRowSchema = z.object({
  id: z.string().uuid(),
  employeeId: z.string().uuid(),
  salaryCents: positiveCents,
  jobTitle: nonBlankString,
  effectiveFrom: z.date(),
  effectiveTo: z.date().nullable(),
  createdAt: z.date(),
});

export type EmployeeHistoryRow = z.infer<typeof EmployeeHistoryRowSchema>;

/** Hire date (YYYY-MM-DD) → UTC midnight timestamptz for the initial history row. */
export function hireDateToEffectiveFrom(hireDate: string): string {
  return `${hireDate}T00:00:00.000Z`;
}
