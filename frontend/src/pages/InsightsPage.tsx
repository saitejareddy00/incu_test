import { Box, Typography } from '@mui/material';

export default function InsightsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Insights
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Country and job-title salary insights coming in EPIC-7.
      </Typography>
    </Box>
  );
}
