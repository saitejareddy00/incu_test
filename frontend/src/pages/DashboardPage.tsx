import {
  Box,
  Grid,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useOverviewMetrics } from '../api/hooks';
import { ApiResponseError } from '../api/types';
import { ErrorBanner } from '../notifications/ErrorBanner';
import { formatSalaryCents } from '../utils/formatSalary';

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Paper>
  );
}

interface RankedRow {
  label: string;
  sublabel?: string;
  value: string;
  barPercent: number;
}

function RankedList({ title, rows }: { title: string; rows: RankedRow[] }) {
  const max = rows[0]?.barPercent ?? 100;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        {title}
      </Typography>
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No data
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {rows.map((row) => (
            <Box key={row.label}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.label}
                  {row.sublabel && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {row.sublabel}
                    </Typography>
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {row.value}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(row.barPercent / max) * 100}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'grey.100',
                  '& .MuiLinearProgress-bar': { bgcolor: 'primary.main', borderRadius: 2 },
                }}
              />
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default function DashboardPage() {
  const { data, isPending, error } = useOverviewMetrics();

  const errorMessage =
    error instanceof ApiResponseError
      ? error.message
      : error instanceof Error
        ? error.message
        : null;

  if (isPending) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={160} height={32} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Skeleton variant="rectangular" height={88} sx={{ borderRadius: 1 }} />
          </Grid>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const topCountries: RankedRow[] = (data?.topCountriesByAvgSalary ?? []).map((c) => ({
    label: c.country,
    sublabel: `${c.count} employees`,
    value: formatSalaryCents(c.avg),
    barPercent: c.avg,
  }));

  const topJobs: RankedRow[] = (data?.topJobTitlesByAvgSalary ?? []).map((j) => ({
    label: j.jobTitle,
    sublabel: `${j.count} employees`,
    value: formatSalaryCents(j.avg),
    barPercent: j.avg,
  }));

  const departments: RankedRow[] = (data?.headcountByDepartment ?? []).map((d) => ({
    label: d.department,
    value: String(d.count),
    barPercent: d.count,
  }));

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="h6">Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Company-wide salary overview
        </Typography>
      </Box>

      {errorMessage && <ErrorBanner message={errorMessage} />}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <StatCard label="Total Employees" value={data?.totalEmployees.toLocaleString() ?? '—'} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <RankedList title="Top Countries by Avg Salary" rows={topCountries} />
        </Grid>
        <Grid item xs={12} md={4}>
          <RankedList title="Top Job Titles by Avg Salary" rows={topJobs} />
        </Grid>
        <Grid item xs={12} md={4}>
          <RankedList title="Headcount by Department" rows={departments} />
        </Grid>
      </Grid>
    </Box>
  );
}
