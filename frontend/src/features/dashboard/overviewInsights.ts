import type { OverviewMetrics } from '../../api/types';
import { findCountry } from '../employees/countries';
import { formatSalaryCents } from '../../utils/formatSalary';

export interface DashboardHighlight {
  id: string;
  label: string;
  value: string;
  detail: string;
}

export interface InsightBullet {
  text: string;
}

export function countryLabel(code: string): string {
  return findCountry(code)?.name ?? code;
}

export function buildHighlights(data: OverviewMetrics): DashboardHighlight[] {
  const topCountry = data.topCountriesByAvgSalary[0];
  const topJob = data.topJobTitlesByAvgSalary[0];
  const topDept = [...data.headcountByDepartment].sort((a, b) => b.count - a.count)[0];
  const deptCount = data.headcountByDepartment.length;

  return [
    {
      id: 'headcount',
      label: 'Active employees',
      value: data.totalEmployees.toLocaleString(),
      detail: 'Across all departments',
    },
    {
      id: 'top-country',
      label: 'Top-paying country',
      value: topCountry ? countryLabel(topCountry.country) : '—',
      detail: topCountry
        ? `${formatSalaryCents(topCountry.avg)} avg · ${topCountry.count} people`
        : 'No data',
    },
    {
      id: 'top-role',
      label: 'Highest-paid role',
      value: topJob?.jobTitle ?? '—',
      detail: topJob ? `${formatSalaryCents(topJob.avg)} avg · ${topJob.count} people` : 'No data',
    },
    {
      id: 'top-dept',
      label: 'Largest department',
      value: topDept?.department ?? '—',
      detail: topDept ? `${topDept.count} people · ${deptCount} departments total` : 'No data',
    },
  ];
}

export function buildInsightBullets(data: OverviewMetrics): InsightBullet[] {
  const bullets: InsightBullet[] = [];
  const topCountry = data.topCountriesByAvgSalary[0];
  const topJob = data.topJobTitlesByAvgSalary[0];
  const topDept = [...data.headcountByDepartment].sort((a, b) => b.count - a.count)[0];

  if (topCountry) {
    bullets.push({
      text: `${countryLabel(topCountry.country)} leads average compensation at ${formatSalaryCents(topCountry.avg)} across ${topCountry.count} employees.`,
    });
  }
  if (topJob) {
    bullets.push({
      text: `${topJob.jobTitle} is the highest-paid role on average (${formatSalaryCents(topJob.avg)}, ${topJob.count} employees).`,
    });
  }
  if (topDept && data.totalEmployees > 0) {
    const pct = Math.round((topDept.count / data.totalEmployees) * 100);
    bullets.push({
      text: `${topDept.department} is the largest team — ${topDept.count} people (${pct}% of headcount).`,
    });
  }
  if (data.topCountriesByAvgSalary.length >= 2) {
    const gap = topCountry.avg - data.topCountriesByAvgSalary[1].avg;
    if (gap > 0) {
      bullets.push({
        text: `Pay gap between #1 and #2 countries is ${formatSalaryCents(gap)} in average salary.`,
      });
    }
  }

  return bullets;
}
