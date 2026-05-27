import { EMPLOYEE_CURRENCY } from '../employees/currency';
import { type Rng, pick, randInt } from './prng';

// ── Static domain lists ───────────────────────────────────────────────────────

/** ISO-3166-1 alpha-2 codes — broad geographic spread. */
export const COUNTRIES = [
  'US',
  'GB',
  'DE',
  'FR',
  'CA',
  'AU',
  'IN',
  'BR',
  'SG',
  'JP',
  'NL',
  'SE',
  'CH',
  'ES',
  'IT',
  'PL',
  'MX',
  'ZA',
  'KR',
  'AE',
] as const;

export const JOB_TITLES = [
  'Software Engineer',
  'Senior Software Engineer',
  'Staff Engineer',
  'Principal Engineer',
  'Engineering Manager',
  'Product Manager',
  'Senior Product Manager',
  'Data Scientist',
  'Machine Learning Engineer',
  'Data Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'UX Designer',
  'Product Designer',
  'QA Engineer',
  'Security Engineer',
  'Solutions Architect',
  'Technical Program Manager',
  'Finance Analyst',
  'HR Business Partner',
] as const;

export const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Data',
  'Design',
  'Operations',
  'Finance',
  'Human Resources',
  'Sales',
  'Marketing',
  'Legal',
] as const;

// ── Generators ────────────────────────────────────────────────────────────────

export function generateCountry(rng: Rng): string {
  return pick(rng, COUNTRIES);
}

export function generateJobTitle(rng: Rng): string {
  return pick(rng, JOB_TITLES);
}

export function generateDepartment(rng: Rng): string {
  return pick(rng, DEPARTMENTS);
}

/**
 * Salary in cents: 30 000 – 300 000 USD (or equivalent).
 * Stored as whole-cent integers (bigint in DB).
 */
export function generateSalaryCents(rng: Rng): number {
  const MIN_CENTS = 3_000_000; // $30 000.00
  const MAX_CENTS = 30_000_000; // $300 000.00
  return MIN_CENTS + randInt(rng, MAX_CENTS - MIN_CENTS + 1);
}

/**
 * Hire date between 2015-01-01 and today, formatted as YYYY-MM-DD.
 * Using epoch arithmetic avoids the Date API's month-0-indexing pitfalls
 * and keeps the generator pure (no Date.now() dependency).
 */
export function generateHireDate(rng: Rng): string {
  const START_EPOCH = Date.UTC(2015, 0, 1); // 2015-01-01
  const END_EPOCH = Date.UTC(2025, 11, 31); // 2025-12-31
  const days = Math.floor((END_EPOCH - START_EPOCH) / 86_400_000);
  const pickedMs = START_EPOCH + randInt(rng, days + 1) * 86_400_000;
  return new Date(pickedMs).toISOString().slice(0, 10);
}

// ── Row builder ───────────────────────────────────────────────────────────────

export interface SeedRow {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  country: string;
  department: string;
  salaryCents: number;
  currency: string;
  hireDate: string;
}

/**
 * Generate one complete seed row.
 * @param rng    Stateful PRNG (mutated in place).
 * @param index  0-based row index — used to guarantee a globally unique email.
 * @param firstNames  Pre-loaded names array (loaded once, not re-read per row).
 * @param lastNames   Pre-loaded names array.
 */
export function generateRow(
  rng: Rng,
  index: number,
  firstNames: readonly string[],
  lastNames: readonly string[],
): SeedRow {
  const firstName = pick(rng, firstNames);
  const lastName = pick(rng, lastNames);
  const country = generateCountry(rng);
  const jobTitle = generateJobTitle(rng);
  const department = generateDepartment(rng);
  const salaryCents = generateSalaryCents(rng);
  const hireDate = generateHireDate(rng);
  const currency = EMPLOYEE_CURRENCY;
  // Row index in email ensures global uniqueness regardless of name collisions.
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${index}@example.com`.replace(
    /\s+/g,
    '.',
  );

  return {
    firstName,
    lastName,
    email,
    jobTitle,
    country,
    department,
    salaryCents,
    currency,
    hireDate,
  };
}
