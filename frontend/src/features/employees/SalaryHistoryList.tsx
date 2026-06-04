import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import type { EmployeeHistoryEntry } from '../../api/types';
import { formatDate } from '../../utils/formatDate';
import { formatSalaryCents } from '../../utils/formatSalary';

interface Props {
  history: EmployeeHistoryEntry[];
}

function formatPeriod(from: string, to: string | null): string {
  const start = formatDate(from);
  if (!to) return `${start} — Present`;
  return `${start} — ${formatDate(to)}`;
}

function ChangeIcon({ delta }: { delta: number }) {
  if (delta > 0) return <TrendingUpIcon fontSize="small" color="success" />;
  if (delta < 0) return <TrendingDownIcon fontSize="small" color="error" />;
  return <TrendingFlatIcon fontSize="small" color="disabled" />;
}

export function SalaryHistoryList({ history }: Props) {
  if (history.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Salary changes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No recorded salary changes.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Salary changes
      </Typography>
      <List disablePadding dense>
        {history.map((entry, index) => {
          const previous = history[index + 1];
          const delta = previous ? entry.salaryCents - previous.salaryCents : null;
          const isCurrent = entry.effectiveTo === null;

          return (
            <Box key={entry.id}>
              {index > 0 && <Divider component="li" sx={{ my: 1 }} />}
              <ListItem disableGutters sx={{ alignItems: 'flex-start', py: 0.75 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatSalaryCents(entry.salaryCents)}
                      </Typography>
                      {isCurrent && (
                        <Chip label="Current" size="small" color="primary" variant="outlined" />
                      )}
                      {delta !== null && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          <ChangeIcon delta={delta} />
                          <Typography
                            variant="caption"
                            color={delta > 0 ? 'success.main' : delta < 0 ? 'error.main' : 'text.secondary'}
                          >
                            {delta > 0 ? '+' : ''}
                            {formatSalaryCents(delta)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" color="text.secondary" component="span" display="block">
                        {formatPeriod(entry.effectiveFrom, entry.effectiveTo)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="span">
                        {entry.jobTitle}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            </Box>
          );
        })}
      </List>
    </Paper>
  );
}
