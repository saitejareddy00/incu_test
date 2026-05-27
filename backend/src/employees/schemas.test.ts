import { describe, it, expect } from 'vitest';
import { CreateEmployeeInputSchema, UpdateEmployeeInputSchema, EmployeeRowSchema } from './schemas';

// ── CreateEmployeeInputSchema ────────────────────────────────────────────────

describe('CreateEmployeeInputSchema', () => {
  const valid = {
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    jobTitle: 'Engineer',
    country: 'US',
    department: 'Engineering',
    salaryCents: 100_000,
    currency: 'USD',
    hireDate: '2024-01-15',
  };

  it('accepts a fully valid input', () => {
    expect(CreateEmployeeInputSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = CreateEmployeeInputSchema.safeParse({ ...valid, email: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = CreateEmployeeInputSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects salary_cents of 0', () => {
    const result = CreateEmployeeInputSchema.safeParse({ ...valid, salaryCents: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative salary_cents', () => {
    const result = CreateEmployeeInputSchema.safeParse({ ...valid, salaryCents: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects blank firstName', () => {
    const result = CreateEmployeeInputSchema.safeParse({ ...valid, firstName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects blank lastName', () => {
    const result = CreateEmployeeInputSchema.safeParse({ ...valid, lastName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects blank jobTitle', () => {
    const result = CreateEmployeeInputSchema.safeParse({ ...valid, jobTitle: '' });
    expect(result.success).toBe(false);
  });

  it('rejects blank department', () => {
    const result = CreateEmployeeInputSchema.safeParse({ ...valid, department: '' });
    expect(result.success).toBe(false);
  });

  it('rejects country not exactly 2 characters', () => {
    const result = CreateEmployeeInputSchema.safeParse({ ...valid, country: 'USA' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid hireDate', () => {
    const result = CreateEmployeeInputSchema.safeParse({ ...valid, hireDate: 'not-a-date' });
    expect(result.success).toBe(false);
  });

  it('defaults currency to USD when omitted', () => {
    const result = CreateEmployeeInputSchema.safeParse({ ...valid, currency: undefined });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.currency).toBe('USD');
  });

  it('rejects non-USD currency on create', () => {
    const result = CreateEmployeeInputSchema.safeParse({ ...valid, currency: 'GBP' });
    expect(result.success).toBe(false);
  });
});

// ── UpdateEmployeeInputSchema ────────────────────────────────────────────────

describe('UpdateEmployeeInputSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(UpdateEmployeeInputSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial update with only email', () => {
    expect(UpdateEmployeeInputSchema.safeParse({ email: 'new@example.com' }).success).toBe(true);
  });

  it('still rejects invalid email when provided', () => {
    expect(UpdateEmployeeInputSchema.safeParse({ email: 'bad' }).success).toBe(false);
  });

  it('still rejects salary_cents <= 0 when provided', () => {
    expect(UpdateEmployeeInputSchema.safeParse({ salaryCents: 0 }).success).toBe(false);
  });

  it('still rejects blank firstName when provided', () => {
    expect(UpdateEmployeeInputSchema.safeParse({ firstName: '' }).success).toBe(false);
  });
});

// ── EmployeeRowSchema ────────────────────────────────────────────────────────

describe('EmployeeRowSchema', () => {
  const validRow = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    firstName: 'Alice',
    lastName: 'Smith',
    fullName: 'Alice Smith',
    email: 'alice@example.com',
    jobTitle: 'Engineer',
    country: 'US',
    department: 'Engineering',
    salaryCents: 100_000,
    currency: 'USD',
    hireDate: new Date('2024-01-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    deletedAt: null,
  };

  it('accepts a valid DB row', () => {
    expect(EmployeeRowSchema.safeParse(validRow).success).toBe(true);
  });

  it('requires id to be a UUID', () => {
    expect(EmployeeRowSchema.safeParse({ ...validRow, id: 'not-a-uuid' }).success).toBe(false);
  });

  it('requires createdAt and updatedAt', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, ...withoutCreatedAt } = validRow;
    expect(EmployeeRowSchema.safeParse(withoutCreatedAt).success).toBe(false);
  });
});
