import {
  Autocomplete,
  Box,
  Grid,
  Paper,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useCountryStats } from '../api/hooks';
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
  const country = searchParams.get('country') ?? '';

  const { data, isPending, error } = useCountryStats(country);

  const errorMessage =
    error instanceof ApiResponseError
      ? error.message
      : error instanceof Error
        ? error.message
        : null;

  function setCountry(code: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (code) {
        next.set('country', code);
      } else {
        next.delete('country');
      }
      return next;
    });
  }

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="h6">Insights</Typography>
        <Typography variant="body2" color="text.secondary">
          Salary statistics by country
        </Typography>
      </Box>

      <Autocomplete<Country>
        size="small"
        options={COUNTRIES}
        value={country ? (findCountry(country) ?? null) : null}
        getOptionLabel={(o) => `${o.name} (${o.code})`}
        isOptionEqualToValue={(o, v) => o.code === v.code}
        onChange={(_e, option) => setCountry(option?.code ?? '')}
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

      {country && isPending && (
        <Grid container spacing={2}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Skeleton variant="rectangular" height={72} sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
      )}

      {country && errorMessage && <ErrorBanner message={errorMessage} />}

      {country && data && !isPending && (
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
