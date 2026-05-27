import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCountryJobStats, useCountryStats, useJobTitles } from '../api/hooks';
import { ApiResponseError, type CountryStats } from '../api/types';
import { KpiCard } from '../components/KpiCard';
import { COUNTRIES, findCountry, type Country } from '../features/employees/countries';
import { SalaryRangeViz } from '../features/insights/SalaryRangeViz';
import {
  countryInsightBullets,
  formatDeltaPct,
  roleInsightBullets,
} from '../features/insights/insightsHelpers';
import { countryLabel } from '../features/dashboard/overviewInsights';
import { ErrorBanner } from '../notifications/ErrorBanner';
import { formatSalaryCents } from '../utils/formatSalary';

function FilterPanel({
  countryOption,
  jobTitle,
  jobTitleOptions,
  jobTitlesPending,
  onCountryChange,
  onJobTitleChange,
}: {
  countryOption: Country | null;
  jobTitle: string;
  jobTitleOptions: string[];
  jobTitlesPending: boolean;
  onCountryChange: (code: string) => void;
  onJobTitleChange: (title: string) => void;
}) {
  const country = countryOption?.code ?? '';

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Explore by market
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Autocomplete<Country>
            size="small"
            options={COUNTRIES}
            value={countryOption}
            getOptionLabel={(o) => `${o.name} (${o.code})`}
            isOptionEqualToValue={(o, v) => o.code === v.code}
            onChange={(_e, option) => onCountryChange(option?.code ?? '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Country"
                inputProps={{ ...params.inputProps, 'aria-label': 'country' }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} md={7}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Role (optional)
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label="All roles"
              size="small"
              variant={!jobTitle ? 'filled' : 'outlined'}
              color={!jobTitle ? 'secondary' : 'default'}
              onClick={() => onJobTitleChange('')}
              disabled={!country}
              sx={{ cursor: country ? 'pointer' : 'default' }}
            />
            {jobTitlesPending && country && (
              <Chip label="Loading roles…" size="small" variant="outlined" />
            )}
            {country &&
              jobTitleOptions.map((title) => (
                <Chip
                  key={title}
                  label={title}
                  size="small"
                  variant={jobTitle === title ? 'filled' : 'outlined'}
                  color={jobTitle === title ? 'secondary' : 'default'}
                  onClick={() => onJobTitleChange(jobTitle === title ? '' : title)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
}

function CountryOverview({ stats, label }: { stats: CountryStats; label: string }) {
  const bullets = useMemo(() => countryInsightBullets(stats), [stats]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        Country overview
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} lg={5}>
          <SalaryRangeViz min={stats.min} max={stats.max} avg={stats.avg} median={stats.median} />
        </Grid>
        <Grid item xs={12} lg={7}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <KpiCard
                label="Headcount"
                value={stats.count.toLocaleString()}
                icon={<GroupsIcon fontSize="small" />}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <KpiCard
                label="Average (USD)"
                value={formatSalaryCents(stats.avg)}
                icon={<ShowChartIcon fontSize="small" />}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <KpiCard
                label="Median (USD)"
                value={formatSalaryCents(stats.median)}
                icon={<TrendingUpIcon fontSize="small" />}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <KpiCard label="Minimum (USD)" value={formatSalaryCents(stats.min)} detail="Floor" />
            </Grid>
            <Grid item xs={6} sm={4}>
              <KpiCard
                label="Maximum (USD)"
                value={formatSalaryCents(stats.max)}
                detail="Ceiling"
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {bullets.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 2, bgcolor: 'rgba(99, 102, 241, 0.04)', borderColor: 'rgba(99, 102, 241, 0.2)' }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <LightbulbOutlinedIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {label} insights
            </Typography>
          </Box>
          <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2 }}>
            {bullets.map((b, i) => (
              <Typography key={i} component="li" variant="body2" color="text.secondary">
                {b}
              </Typography>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

function RoleFocus({
  country,
  countryStats,
  jobTitle,
}: {
  country: string;
  countryStats: CountryStats;
  jobTitle: string;
}) {
  const { data, isPending, error } = useCountryJobStats(country, jobTitle);

  const errorMessage =
    error instanceof ApiResponseError
      ? error.message
      : error instanceof Error
        ? error.message
        : null;

  if (isPending) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Skeleton variant="rectangular" height={88} sx={{ borderRadius: 1 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (errorMessage) return <ErrorBanner message={errorMessage} />;
  if (!data) return null;

  const delta = formatDeltaPct(data.avg, countryStats.avg);
  const aboveAvg = data.avg >= countryStats.avg;
  const bullets = roleInsightBullets(jobTitle, data, countryStats);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WorkOutlineIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Role focus — {jobTitle}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <KpiCard
            label="Role average (USD)"
            value={formatSalaryCents(data.avg)}
            detail={`${data.count} employees`}
            icon={<WorkOutlineIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard
            label="vs country average"
            value={delta}
            detail={`Country avg ${formatSalaryCents(countryStats.avg)}`}
            icon={
              aboveAvg ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />
            }
            accent={aboveAvg ? '#22c55e' : '#f59e0b'}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard
            label="Share of country"
            value={`${Math.round((data.count / countryStats.count) * 100)}%`}
            detail={`${data.count} of ${countryStats.count} people`}
            icon={<GroupsIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2 }}>
          {bullets.map((b, i) => (
            <Typography key={i} component="li" variant="body2" color="text.secondary">
              {b}
            </Typography>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}

export default function InsightsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  function updateParams(updates: { country?: string; jobTitle?: string }) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (updates.country !== undefined) {
        if (updates.country) next.set('country', updates.country);
        else {
          next.delete('country');
          next.delete('jobTitle');
        }
      }
      if (updates.jobTitle !== undefined) {
        if (updates.jobTitle) next.set('jobTitle', updates.jobTitle);
        else next.delete('jobTitle');
      }
      return next;
    });
  }

  const country = searchParams.get('country') ?? '';
  const jobTitle = searchParams.get('jobTitle') ?? '';
  const countryOption = country ? (findCountry(country) ?? null) : null;
  const label = countryOption ? countryLabel(country) : '';

  const countryQuery = useCountryStats(country);
  const { data: jobTitlesData, isPending: jobTitlesPending } = useJobTitles(country);

  const countryError =
    countryQuery.error instanceof ApiResponseError
      ? countryQuery.error.message
      : countryQuery.error instanceof Error
        ? countryQuery.error.message
        : null;

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Hero */}
      <Paper
        sx={{
          p: 3,
          background: country
            ? 'linear-gradient(135deg, #111827 0%, #1e3a5f 50%, #312e81 100%)'
            : 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          color: '#f9fafb',
          borderRadius: 2,
          border: 'none',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: '#a5b4fc', letterSpacing: '0.12em' }}>
              Compensation insights
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mt: 0.5 }}>
              {country ? label : 'Select a market to analyze'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af', mt: 1 }}>
              {country
                ? 'Compare country-wide pay bands, then drill into a specific role.'
                : 'Pick a country to load salary statistics and role-level benchmarks.'}
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/"
            size="small"
            startIcon={<ArrowBackIcon />}
            sx={{ color: '#e5e7eb', borderColor: 'rgba(255,255,255,0.2)', flexShrink: 0 }}
            variant="outlined"
          >
            Dashboard
          </Button>
        </Box>
      </Paper>

      <FilterPanel
        countryOption={countryOption}
        jobTitle={jobTitle}
        jobTitleOptions={jobTitlesData?.jobTitles ?? []}
        jobTitlesPending={jobTitlesPending}
        onCountryChange={(code) => updateParams({ country: code, jobTitle: '' })}
        onJobTitleChange={(title) => updateParams({ jobTitle: title })}
      />

      {!country && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <ShowChartIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Choose a country above to view interactive compensation insights.
          </Typography>
        </Paper>
      )}

      {country && countryQuery.isPending && (
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
        </Stack>
      )}

      {country && countryError && <ErrorBanner message={countryError} />}

      {country && countryQuery.data && !countryQuery.isPending && (
        <>
          <CountryOverview stats={countryQuery.data} label={label} />

          {jobTitle && (
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <RoleFocus country={country} countryStats={countryQuery.data} jobTitle={jobTitle} />
            </Paper>
          )}

          {!jobTitle && jobTitlesData && jobTitlesData.jobTitles.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Select a role chip above to compare against the country benchmark.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
