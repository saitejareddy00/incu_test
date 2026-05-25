import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { Outlet, NavLink } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Employees', to: '/employees' },
  { label: 'Insights', to: '/insights' },
] as const;

export default function AppShell() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4, fontWeight: 700 }}>
            Salary Management
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {NAV_LINKS.map(({ label, to }) => (
              <Button
                key={to}
                component={NavLink}
                to={to}
                end={to === '/'}
                color="inherit"
                sx={{
                  '&.active': { borderBottom: '2px solid white' },
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" component="main" sx={{ flex: 1, py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
