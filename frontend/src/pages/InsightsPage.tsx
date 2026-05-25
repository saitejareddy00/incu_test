import {
  Autocomplete,
  Box,
  Grid,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCountryJobStats, useCountryStats } from '../api/hooks';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { ApiResponseError } from '../api/types';
import { COUNTRIES, findCountry, type Country } from '../features/employees/countries';
import { ErrorBanner } from '../notifications/ErrorBanner';
import { formatSalaryCents } from '../utils/formatSalary';

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Paper>
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
  const jobTitleParam = searchParams.get('jobTitle') ?? '';
  const [jobTitleInput, setJobTitleInput] = useState(jobTitleParam);
  const debouncedJobTitle = useDebouncedValue(jobTitleInput, 300);

  useEffect(() => {
    setJobTitleInput(jobTitleParam);
  }, [jobTitleParam]);

  useEffect(() => {
    if (debouncedJobTitle === jobTitleParam) return;
    updateParams({ jobTitle: debouncedJobTitle });
  }, [debouncedJobTitle, jobTitleParam]);

  const isCombined = Boolean(country && debouncedJobTitle);

  const countryQuery = useCountryStats(country);
  const combinedQuery = useCountryJobStats(country, debouncedJobTitle);

  const { data, isPending, error } = isCombined ? combinedQuery : countryQuery;

  const errorMessage =
    error instanceof ApiResponseError
      ? error.message
      : error instanceof Error
        ? error.message
        : null;

  const skeletonCount = isCombined ? 2 : 5;

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="h6">Insights</Typography>
        <Typography variant="body2" color="text.secondary">
          {isCombined
            ? 'Salary statistics by country and job title'
            : 'Salary statistics by country'}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.5} flexWrap="wrap">
        <Autocomplete<Country>
          size="small"
          options={COUNTRIES}
          value={country ? (findCountry(country) ?? null) : null}
          getOptionLabel={(o) => `${o.name} (${o.code})`}
          isOptionEqualToValue={(o, v) => o.code === v.code}
          onChange={(_e, option) => updateParams({ country: option?.code ?? '' })}
          sx={{ minWidth: 280 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Country"
              inputProps={{ ...params.inputProps, 'aria-label': 'country' }}
            />
          )}
        />
        <TextField
          size="small"
          label="Job Title"
          placeholder="e.g. Engineer"
          value={jobTitleInput}
          onChange={(e) => setJobTitleInput(e.target.value)}
          inputProps={{ 'aria-label': 'job title' }}
          sx={{ minWidth: 200 }}
          disabled={!country}
        />
      </Stack>

      {!country && (
        <Typography variant="body2" color="text.secondary">
          Select a country to view salary insights.
        </Typography>
      )}

      {country && isPending && (
        <Grid container spacing={2}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Skeleton variant="rectangular" height={72} sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
      )}

      {country && errorMessage && <ErrorBanner message={errorMessage} />}

      {country && data && !isPending && isCombined && 'avg' in data && (
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={3}>
            <StatCard label="Average Salary" value={formatSalaryCents(data.avg)} />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <StatCard label="Employees" value={data.count.toLocaleString()} />
          </Grid>
        </Grid>
      )}

      {country && data && !isPending && !isCombined && 'min' in data && (
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Employees" value={data.count.toLocaleString()} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Minimum" value={formatSalaryCents(data.min)} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Maximum" value={formatSalaryCents(data.max)} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Average" value={formatSalaryCents(data.avg)} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard label="Median" value={formatSalaryCents(data.median)} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
