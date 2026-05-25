import { Typography, Container, Box } from '@mui/material';

export default function App() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1">
          Salary Management System
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
          Implementation coming in EPIC-5 onwards.
        </Typography>
      </Box>
    </Container>
  );
}
