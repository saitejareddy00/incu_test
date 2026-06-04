import { Box, Paper, Typography } from '@mui/material';
import type { EmployeeHistoryEntry } from '../../api/types';
import { formatDate } from '../../utils/formatDate';
import { formatSalaryCents } from '../../utils/formatSalary';

interface Props {
  history: EmployeeHistoryEntry[];
}

const CHART_WIDTH = 280;
const CHART_HEIGHT = 160;
const PAD = { top: 16, right: 12, bottom: 28, left: 48 };

function parseUtcDate(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function chronological(history: EmployeeHistoryEntry[]): EmployeeHistoryEntry[] {
  return [...history].sort(
    (a, b) => parseUtcDate(a.effectiveFrom) - parseUtcDate(b.effectiveFrom),
  );
}

function buildStepPath(
  points: Array<{ x: number; y: number }>,
): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` H ${points[i].x} V ${points[i].y}`;
  }
  return d;
}

export function SalaryHistoryChart({ history }: Props) {
  const ordered = chronological(history);

  if (ordered.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Salary over time
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No salary history yet
        </Typography>
      </Paper>
    );
  }

  const salaries = ordered.map((h) => h.salaryCents);
  const minSalary = Math.min(...salaries);
  const maxSalary = Math.max(...salaries);
  const salaryRange = maxSalary - minSalary || 1;

  const dates = ordered.map((h) => parseUtcDate(h.effectiveFrom));
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  const dateRange = maxDate - minDate || 1;

  const innerW = CHART_WIDTH - PAD.left - PAD.right;
  const innerH = CHART_HEIGHT - PAD.top - PAD.bottom;

  const points = ordered.map((entry) => {
    const x =
      PAD.left +
      ((parseUtcDate(entry.effectiveFrom) - minDate) / dateRange) * innerW;
    const y =
      PAD.top +
      innerH -
      ((entry.salaryCents - minSalary) / salaryRange) * innerH;
    return { x, y, entry };
  });

  const yTicks = [minSalary, maxSalary].filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
        Salary over time
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        {formatDate(ordered[0].effectiveFrom)} —{' '}
        {ordered[ordered.length - 1].effectiveTo
          ? formatDate(ordered[ordered.length - 1].effectiveTo!)
          : 'Present'}
      </Typography>

      <Box sx={{ overflowX: 'auto' }}>
        <svg
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          role="img"
          aria-label="Salary history step chart"
        >
          {[0, 0.5, 1].map((t) => {
            const y = PAD.top + innerH * (1 - t);
            return (
              <line
                key={t}
                x1={PAD.left}
                y1={y}
                x2={CHART_WIDTH - PAD.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
            );
          })}

          <path
            d={buildStepPath(points)}
            fill="none"
            stroke="#6366f1"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {points.map(({ x, y, entry }) => (
            <g key={entry.id}>
              <circle cx={x} cy={y} r={4} fill="#6366f1" />
              <title>
                {formatDate(entry.effectiveFrom)}: {formatSalaryCents(entry.salaryCents)}
              </title>
            </g>
          ))}

          {yTicks.map((salary) => {
            const y =
              PAD.top +
              innerH -
              ((salary - minSalary) / salaryRange) * innerH;
            return (
              <text
                key={salary}
                x={PAD.left - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="#6b7280"
              >
                {formatSalaryCents(salary)}
              </text>
            );
          })}

          <text
            x={PAD.left}
            y={CHART_HEIGHT - 6}
            fontSize={10}
            fill="#6b7280"
          >
            {formatDate(ordered[0].effectiveFrom)}
          </text>
          <text
            x={CHART_WIDTH - PAD.right}
            y={CHART_HEIGHT - 6}
            textAnchor="end"
            fontSize={10}
            fill="#6b7280"
          >
            {formatDate(ordered[ordered.length - 1].effectiveFrom)}
          </text>
        </svg>
      </Box>
    </Paper>
  );
}
