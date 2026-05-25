import { Box, Paper, Typography } from '@mui/material';
import { formatSalaryCents } from '../../utils/formatSalary';

interface Props {
  min: number;
  max: number;
  avg: number;
  median: number;
}

export function SalaryRangeViz({ min, max, avg }: Props) {
  const spread = max - min;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        bgcolor: 'rgba(99, 102, 241, 0.03)',
        borderColor: 'rgba(99, 102, 241, 0.15)',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
        Salary distribution
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Spread of {formatSalaryCents(spread)} between lowest and highest paid
      </Typography>

      <Box sx={{ position: 'relative', height: 72, mb: 3, px: 0.5 }}>
        {/* Gradient bar */}
        <Box
          sx={{
            position: 'absolute',
            top: 32,
            left: 0,
            right: 0,
            height: 8,
            borderRadius: 4,
            background: 'linear-gradient(90deg, #c7d2fe 0%, #6366f1 50%, #312e81 100%)',
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Minimum
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatSalaryCents(min)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Average
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'secondary.main' }}>
            {formatSalaryCents(avg)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            Maximum
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatSalaryCents(max)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
