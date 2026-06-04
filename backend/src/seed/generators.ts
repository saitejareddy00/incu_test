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

/** Fixed "present" date for open history periods (matches hire-date upper bound). */
export const HISTORY_END_DATE = '2025-12-31';

export interface HistorySeedRow {
  salaryCents: number;
  jobTitle: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

function parseUtcDate(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function addDays(iso: string, days: number): string {
  return new Date(parseUtcDate(iso) + days * 86_400_000).toISOString();
}

/**
 * Generate 1–4 salary history periods ending at the employee's current salary/job title.
 * Periods are spaced two days apart so effective_to > effective_from is always satisfied.
 */
export function generateHistoryForEmployee(
  rng: Rng,
  hireDate: string,
  finalSalaryCents: number,
  finalJobTitle: string,
): HistorySeedRow[] {
  let periodCount = 1 + randInt(rng, 4);

  const totalDays = Math.floor(
    (parseUtcDate(HISTORY_END_DATE) - parseUtcDate(hireDate)) / 86_400_000,
  );
  const minDaysForPeriods = periodCount > 1 ? 2 * (periodCount - 1) + 1 : 0;
  while (periodCount > 1 && totalDays < minDaysForPeriods) {
    periodCount--;
  }

  if (periodCount === 1) {
    return [
      {
        salaryCents: finalSalaryCents,
        jobTitle: finalJobTitle,
        effectiveFrom: `${hireDate}T00:00:00.000Z`,
        effectiveTo: null,
      },
    ];
  }

  const rows: HistorySeedRow[] = [];
  for (let i = 0; i < periodCount; i++) {
    const isLast = i === periodCount - 1;
    const from = addDays(hireDate, i * 2);
    const to = isLast ? null : addDays(hireDate, i * 2 + 1);
    const salaryFraction = 0.7 + (0.3 * i) / (periodCount - 1);
    const salaryCents = isLast
      ? finalSalaryCents
      : Math.max(1, Math.round(finalSalaryCents * salaryFraction));

    rows.push({
      salaryCents,
      jobTitle: isLast ? finalJobTitle : generateJobTitle(rng),
      effectiveFrom: from,
      effectiveTo: to,
    });
  }

  return rows;
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
