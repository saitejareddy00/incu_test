import type { CountryJobStats, CountryStats } from '../../api/types';
import { formatSalaryCents } from '../../utils/formatSalary';

export function formatDeltaPct(roleAvg: number, countryAvg: number): string {
  if (countryAvg === 0) return '—';
  const delta = ((roleAvg - countryAvg) / countryAvg) * 100;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

export function countryInsightBullets(stats: CountryStats): string[] {
  const bullets: string[] = [];
  const spread = stats.max - stats.min;

  bullets.push(
    `Average salary is ${formatSalaryCents(stats.avg)} across ${stats.count} employees in this country.`,
  );

  if (stats.median !== stats.avg) {
    const diff = stats.avg - stats.median;
    const dir = diff > 0 ? 'above' : 'below';
    bullets.push(
      `Median (${formatSalaryCents(stats.median)}) sits ${dir} the average — ${formatSalaryCents(Math.abs(diff))} ${dir === 'above' ? 'higher' : 'lower'}.`,
    );
  }

  bullets.push(`Pay ranges from ${formatSalaryCents(stats.min)} to ${formatSalaryCents(stats.max)} (${formatSalaryCents(spread)} spread).`);

  return bullets;
}

export function roleInsightBullets(
  jobTitle: string,
  role: CountryJobStats,
  country: CountryStats,
): string[] {
  const delta = formatDeltaPct(role.avg, country.avg);
  const bullets: string[] = [
    `${jobTitle} averages ${formatSalaryCents(role.avg)} for ${role.count} employees — ${delta} vs country average.`,
  ];

  if (role.avg > country.avg) {
    bullets.push('This role pays above the country median, which may affect overall compensation benchmarks.');
  } else if (role.avg < country.avg) {
    bullets.push('This role pays below the country average; useful when benchmarking new hires in this track.');
  }

  return bullets;
}
