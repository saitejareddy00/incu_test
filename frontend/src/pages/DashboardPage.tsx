import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GroupsIcon from '@mui/icons-material/Groups';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import PublicIcon from '@mui/icons-material/Public';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import {
  Box,
  Button,
  Grid,
  Paper,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOverviewMetrics } from '../api/hooks';
import type { OverviewMetrics } from '../api/types';
import {
  buildHighlights,
  buildInsightBullets,
  countryLabel,
} from '../features/dashboard/overviewInsights';
import { InteractiveBarChart, type BarChartItem } from '../features/dashboard/InteractiveBarChart';
import { ApiResponseError } from '../api/types';
import { ErrorBanner } from '../notifications/ErrorBanner';
import { formatSalaryCents } from '../utils/formatSalary';
import { buildInsightsPath } from '../utils/insightsLink';

type ChartView = 'countries' | 'jobs' | 'departments';

const VIEW_LABELS: Record<ChartView, string> = {
  countries: 'Countries',
  jobs: 'Job titles',
  departments: 'Departments',
};

function KpiCard({
  label,
  value,
  detail,
  icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: '100%',
        borderColor: 'divider',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          borderColor: accent ?? 'secondary.main',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)',
        },
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: accent ? `${accent}18` : 'rgba(99, 102, 241, 0.1)',
            color: accent ?? 'secondary.main',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {label}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {detail}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

function chartItems(data: OverviewMetrics, view: ChartView): BarChartItem[] {
  if (view === 'countries') {
    return data.topCountriesByAvgSalary.map((c) => ({
      id: c.country,
      label: countryLabel(c.country),
      sublabel: `${c.country} · ${c.count} employees`,
      value: formatSalaryCents(c.avg),
      magnitude: c.avg,
      href: buildInsightsPath({ country: c.country }),
    }));
  }
  if (view === 'jobs') {
    return data.topJobTitlesByAvgSalary.map((j) => ({
      id: j.jobTitle,
      label: j.jobTitle,
      sublabel: `${j.count} employees`,
      value: formatSalaryCents(j.avg),
      magnitude: j.avg,
      href: buildInsightsPath({ jobTitle: j.jobTitle }),
    }));
  }
  return data.headcountByDepartment.map((d) => ({
    id: d.department,
    label: d.department,
    sublabel: `${d.count} employees`,
    value: d.count.toLocaleString(),
    magnitude: d.count,
  }));
}

export default function DashboardPage() {
  const { data, isPending, error } = useOverviewMetrics();
  const [view, setView] = useState<ChartView>('countries');

  const errorMessage =
    error instanceof ApiResponseError
      ? error.message
      : error instanceof Error
        ? error.message
        : null;

  const highlights = useMemo(() => (data ? buildHighlights(data) : []), [data]);
  const bullets = useMemo(() => (data ? buildInsightBullets(data) : []), [data]);
  const bars = useMemo(() => (data ? chartItems(data, view) : []), [data, view]);

  if (isPending) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 2 }} />
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={88} sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        {errorMessage && <ErrorBanner message={errorMessage} />}
      </Box>
    );
  }

  const icons = [
    <GroupsIcon key="g" fontSize="small" />,
    <PublicIcon key="p" fontSize="small" />,
    <WorkOutlineIcon key="w" fontSize="small" />,
    <TrendingUpIcon key="t" fontSize="small" />,
  ];

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <Paper
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #312e81 100%)',
          color: '#f9fafb',
          borderRadius: 2,
          border: 'none',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: '#a5b4fc', letterSpacing: '0.12em' }}>
              Salary intelligence
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mt: 0.5 }}>
              Company-wide compensation snapshot
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af', mt: 1, maxWidth: 520 }}>
              {data.totalEmployees.toLocaleString()} active employees · compare pay by country,
              role, and department. Click any bar to drill into detailed insights.
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/insights"
            variant="contained"
            size="small"
            endIcon={<ArrowForwardIcon />}
            sx={{
              bgcolor: '#6366f1',
              flexShrink: 0,
              '&:hover': { bgcolor: '#4f46e5' },
            }}
          >
            Explore insights
          </Button>
        </Box>
      </Paper>

      {errorMessage && <ErrorBanner message={errorMessage} />}

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <Grid container spacing={2}>
        {highlights.map((h, i) => (
          <Grid item xs={12} sm={6} md={3} key={h.id}>
            <KpiCard
              label={h.label}
              value={h.value}
              detail={h.detail}
              icon={icons[i]}
              accent={i === 0 ? '#6366f1' : undefined}
            />
          </Grid>
        ))}
      </Grid>

      {/* ── Insight bullets ────────────────────────────────────────────── */}
      {bullets.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            bgcolor: 'rgba(99, 102, 241, 0.04)',
            borderColor: 'rgba(99, 102, 241, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
            <LightbulbOutlinedIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              What stands out
            </Typography>
          </Box>
          <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
            {bullets.map((b, i) => (
              <Typography key={i} component="li" variant="body2" color="text.secondary">
                {b.text}
              </Typography>
            ))}
          </Stack>
        </Paper>
      )}

      {/* ── Interactive chart ──────────────────────────────────────────── */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Compare {VIEW_LABELS[view].toLowerCase()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {view === 'countries' && 'Average salary by country — click a row to open country insights'}
              {view === 'jobs' && 'Average salary by role — click a row to filter insights by job title'}
              {view === 'departments' && 'Headcount distribution across departments'}
            </Typography>
          </Box>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_e, v: ChartView | null) => v && setView(v)}
            aria-label="chart view"
          >
            <ToggleButton value="countries">Countries</ToggleButton>
            <ToggleButton value="jobs">Job titles</ToggleButton>
            <ToggleButton value="departments">Departments</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <InteractiveBarChart
          items={bars}
          emptyMessage={`No ${VIEW_LABELS[view].toLowerCase()} data yet`}
        />
      </Box>

      {/* ── Quick links ────────────────────────────────────────────────── */}
      <Stack direction="row" spacing={1.5} flexWrap="wrap">
        <Button
          component={Link}
          to="/employees"
          size="small"
          variant="outlined"
          color="inherit"
        >
          Browse employees
        </Button>
        {data.topCountriesByAvgSalary[0] && (
          <Button
            component={Link}
            to={buildInsightsPath({ country: data.topCountriesByAvgSalary[0].country })}
            size="small"
            variant="outlined"
            color="secondary"
          >
            Top country: {countryLabel(data.topCountriesByAvgSalary[0].country)}
          </Button>
        )}
        {data.topJobTitlesByAvgSalary[0] && (
          <Button
            component={Link}
            to={buildInsightsPath({ jobTitle: data.topJobTitlesByAvgSalary[0].jobTitle })}
            size="small"
            variant="outlined"
            color="secondary"
          >
            Top role: {data.topJobTitlesByAvgSalary[0].jobTitle}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
