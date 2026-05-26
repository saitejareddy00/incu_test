import { Box, Paper, Typography } from '@mui/material';
import { formatSalaryCents } from '../../utils/formatSalary';

interface Props {
  min: number;
  max: number;
  avg: number;
  median: number;
}

function pct(value: number, min: number, max: number): number {
  if (max <= min) return 50;
  return ((value - min) / (max - min)) * 100;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Nudge label anchors apart when markers are close; lines stay at true positions. */
function labelPositions(
  avgPos: number,
  medPos: number,
  minGap = 16,
): { avgLabel: number; medLabel: number } {
  const avgLabel = clamp(avgPos, 6, 94);
  const medLabel = clamp(medPos, 6, 94);
  if (Math.abs(avgLabel - medLabel) >= minGap) {
    return { avgLabel, medLabel };
  }
  const mid = (avgLabel + medLabel) / 2;
  const avgFirst = avgPos <= medPos;
  return {
    avgLabel: clamp(avgFirst ? mid - minGap / 2 : mid + minGap / 2, 6, 94),
    medLabel: clamp(avgFirst ? mid + minGap / 2 : mid - minGap / 2, 6, 94),
  };
}

export function SalaryRangeViz({ min, max, avg, median }: Props) {
  const spread = max - min;
  const avgPos = pct(avg, min, max);
  const medPos = pct(median, min, max);
  const { avgLabel, medLabel } = labelPositions(avgPos, medPos);
  const labelsOverlap = Math.abs(avgPos - medPos) < 10;

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

        {/* Average marker (true position) + label above */}
        <Box
          sx={{
            position: 'absolute',
            left: `${avgPos}%`,
            top: 28,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box sx={{ width: 3, height: 14, bgcolor: '#6366f1', borderRadius: 1 }} />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            left: `${avgLabel}%`,
            top: 0,
            transform: 'translateX(-50%)',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: 'secondary.main', lineHeight: 1.2 }}
          >
            Avg
          </Typography>
          {labelsOverlap && (
            <Typography
              variant="caption"
              display="block"
              sx={{ fontSize: 10, color: 'secondary.main' }}
            >
              {formatSalaryCents(avg)}
            </Typography>
          )}
        </Box>

        {/* Median marker (true position) + label below */}
        <Box
          sx={{
            position: 'absolute',
            left: `${medPos}%`,
            top: 38,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box sx={{ width: 2, height: 14, bgcolor: '#111827', borderRadius: 1, opacity: 0.55 }} />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            left: `${medLabel}%`,
            top: 54,
            transform: 'translateX(-50%)',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            Median
          </Typography>
          {labelsOverlap && (
            <Typography
              variant="caption"
              display="block"
              sx={{ fontSize: 10, color: 'text.secondary' }}
            >
              {formatSalaryCents(median)}
            </Typography>
          )}
        </Box>
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
            Median
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatSalaryCents(median)}
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
