import { Box, Paper, Typography } from '@mui/material';

interface Props {
  label: string;
  value: string;
  detail?: string;
  icon?: React.ReactNode;
  accent?: string;
}

export function KpiCard({ label, value, detail, icon, accent }: Props) {
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
        {icon && (
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
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {label}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
            {value}
          </Typography>
          {detail && (
            <Typography variant="caption" color="text.secondary">
              {detail}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
