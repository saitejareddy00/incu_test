import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Employee Detail
      </Typography>
      <Typography variant="body2" color="text.secondary">
        ID: {id}
      </Typography>
    </Box>
  );
}
