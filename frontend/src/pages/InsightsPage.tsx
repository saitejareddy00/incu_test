import {
  Autocomplete,
  Box,
  Divider,
  Grid,
  Paper,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useCountryJobStats, useCountryStats, useJobTitles } from '../api/hooks';
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

function CountryStatsSection({
  country,
  countryLabel,
}: {
  country: string;
  countryLabel: string;
}) {
  const { data, isPending, error } = useCountryStats(country);

  const errorMessage =
    error instanceof ApiResponseError
      ? error.message
      : error instanceof Error
        ? error.message
        : null;

  if (isPending) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Grid item xs={6} sm={4} md={2} key={i}>
            <Skeleton variant="rectangular" height={72} sx={{ borderRadius: 1 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (errorMessage) return <ErrorBanner message={errorMessage} />;
  if (!data) return null;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
        {countryLabel} — country-wide
      </Typography>
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
    </Box>
  );
}

function JobTitleStatsSection({
  country,
  jobTitle,
}: {
  country: string;
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
        {Array.from({ length: 2 }).map((_, i) => (
          <Grid item xs={6} sm={4} md={3} key={i}>
            <Skeleton variant="rectangular" height={72} sx={{ borderRadius: 1 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (errorMessage) return <ErrorBanner message={errorMessage} />;
  if (!data) return null;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
        {jobTitle} — in {country}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard label="Average Salary" value={formatSalaryCents(data.avg)} />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard label="Employees" value={data.count.toLocaleString()} />
        </Grid>
      </Grid>
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
  const countryOption = country ? findCountry(country) : null;
  const countryLabel = countryOption ? `${countryOption.name} (${country})` : country;

  const { data: jobTitlesData, isPending: jobTitlesPending } = useJobTitles(country);
  const jobTitleOptions = jobTitlesData?.jobTitles ?? [];

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="h6">Insights</Typography>
        <Typography variant="body2" color="text.secondary">
          Salary statistics by country and job title
        </Typography>
      </Box>

      <Autocomplete<Country>
        size="small"
        options={COUNTRIES}
        value={countryOption}
        getOptionLabel={(o) => `${o.name} (${o.code})`}
        isOptionEqualToValue={(o, v) => o.code === v.code}
        onChange={(_e, option) => updateParams({ country: option?.code ?? '', jobTitle: '' })}
        sx={{ maxWidth: 320 }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Country"
            inputProps={{ ...params.inputProps, 'aria-label': 'country' }}
          />
        )}
      />

      {!country && (
        <Typography variant="body2" color="text.secondary">
          Select a country to view salary insights.
        </Typography>
      )}

      {country && <CountryStatsSection country={country} countryLabel={countryLabel} />}

      <Divider sx={{ my: 1 }} />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Filter by job title
        </Typography>
        <Autocomplete
          size="small"
          disabled={!country}
          options={jobTitleOptions}
          value={country && jobTitle ? jobTitle : null}
          loading={jobTitlesPending}
          onChange={(_e, value) => updateParams({ jobTitle: value ?? '' })}
          sx={{ maxWidth: 320 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Job Title"
              placeholder={country ? 'Select a job title' : 'Select a country first'}
              inputProps={{ ...params.inputProps, 'aria-label': 'job title' }}
            />
          )}
        />
        {country && !jobTitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Select a job title to see role-specific salary insights below.
          </Typography>
        )}
      </Box>

      {country && jobTitle && (
        <JobTitleStatsSection country={country} jobTitle={jobTitle} />
      )}
    </Box>
  );
}
