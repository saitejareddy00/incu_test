import { Box, Paper, Tooltip, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export interface BarChartItem {
  id: string;
  label: string;
  sublabel?: string;
  value: string;
  magnitude: number;
  href?: string;
}

const BAR_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

interface Props {
  items: BarChartItem[];
  emptyMessage?: string;
}

function BarRow({ item, max, rank }: { item: BarChartItem; max: number; rank: number }) {
  const pct = max > 0 ? (item.magnitude / max) * 100 : 0;
  const color = BAR_COLORS[Math.min(rank, BAR_COLORS.length - 1)];

  const content = (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr auto',
        alignItems: 'center',
        gap: 1.5,
        py: 1.25,
        px: 1.5,
        borderRadius: 1,
        cursor: item.href ? 'pointer' : 'default',
        transition: 'background-color 0.15s, transform 0.15s',
        '&:hover': item.href
          ? { bgcolor: 'rgba(99, 102, 241, 0.06)', transform: 'translateX(2px)' }
          : undefined,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: rank === 0 ? 'secondary.main' : 'text.secondary',
          fontFamily: 'monospace',
        }}
      >
        #{rank + 1}
      </Typography>

      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {item.label}
            </Typography>
            {item.sublabel && (
              <Typography variant="caption" color="text.secondary">
                {item.sublabel}
              </Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 600, ml: 2, flexShrink: 0 }}>
            {item.value}
          </Typography>
        </Box>
        <Box
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: 'grey.100',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: 5,
              bgcolor: color,
              transition: 'width 0.4s ease',
            }}
          />
        </Box>
      </Box>

      {item.href && (
        <Typography variant="caption" color="secondary.main" sx={{ fontWeight: 500 }}>
          View →
        </Typography>
      )}
    </Box>
  );

  if (item.href) {
    return (
      <Tooltip title="Open detailed insights" placement="left">
        <Link to={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
          {content}
        </Link>
      </Tooltip>
    );
  }

  return content;
}

export function InteractiveBarChart({ items, emptyMessage = 'No data available' }: Props) {
  const max = items[0]?.magnitude ?? 0;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderColor: 'divider',
      }}
    >
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {emptyMessage}
        </Typography>
      ) : (
        <Box>
          {items.map((item, i) => (
            <BarRow key={item.id} item={item} max={max} rank={i} />
          ))}
        </Box>
      )}
    </Paper>
  );
}
