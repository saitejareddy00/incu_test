import { Box, Typography } from '@mui/material';

export default function DashboardPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Company-wide salary overview coming in EPIC-7.
      </Typography>
    </Box>
  );
}
