/**
 * Format an ISO date or datetime string for display (e.g. "Jan 15, 2024").
 * Parses the calendar date in UTC so YYYY-MM-DD values don't shift by timezone.
 */
export function formatDate(value: string | undefined | null): string {
  if (!value) return '—';

  const dateOnly = value.slice(0, 10);
  const [year, month, day] = dateOnly.split('-').map(Number);
  if (!year || !month || !day) return value;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
