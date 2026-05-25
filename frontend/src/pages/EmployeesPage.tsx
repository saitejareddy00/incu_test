import { Box, Typography } from '@mui/material';

export default function EmployeesPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Employees
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Employee list with search, filter and sort coming in EPIC-6.
      </Typography>
    </Box>
  );
}
