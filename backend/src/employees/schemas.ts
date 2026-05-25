import { z } from 'zod';

// ── Shared field rules ────────────────────────────────────────────────────────

const nonBlankString = z.string().min(1, 'Must not be blank');
const twoLetterCountry = z.string().length(2, 'Must be an ISO-3166 alpha-2 code');
const threeLetter = z.string().length(3, 'Must be a 3-letter currency code');
const positiveCents = z.number().int().positive('salary_cents must be > 0');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a YYYY-MM-DD date');

// ── Create ────────────────────────────────────────────────────────────────────

export const CreateEmployeeInputSchema = z.object({
  firstName: nonBlankString,
  lastName: nonBlankString,
  email: z.string().email(),
  jobTitle: nonBlankString,
  country: twoLetterCountry,
  department: nonBlankString,
  salaryCents: positiveCents,
  currency: threeLetter.default('USD'),
  hireDate: isoDate,
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeInputSchema>;

// ── Update (all fields optional, same per-field rules) ────────────────────────

export const UpdateEmployeeInputSchema = CreateEmployeeInputSchema.partial()
  .omit({
    currency: true,
  })
  .extend({
    currency: threeLetter.optional(),
  });

export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeInputSchema>;

// ── DB Row ────────────────────────────────────────────────────────────────────

export const EmployeeRowSchema = z.object({
  id: z.string().uuid(),
  firstName: nonBlankString,
  lastName: nonBlankString,
  fullName: z.string(),
  email: z.string().email(),
  jobTitle: nonBlankString,
  country: twoLetterCountry,
  department: nonBlankString,
  salaryCents: positiveCents,
  currency: threeLetter,
  hireDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isDeleted: z.boolean(),
  deletedAt: z.date().nullable(),
});

export type EmployeeRow = z.infer<typeof EmployeeRowSchema>;
