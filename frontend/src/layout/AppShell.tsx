import BarChartIcon from '@mui/icons-material/BarChart';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import { Box, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import { NavLink, Outlet } from 'react-router-dom';

// ── Sidebar design tokens (Cursor-inspired) ───────────────────────────────────
const SIDEBAR_W         = 220;
const SIDEBAR_BG        = '#111827';   // gray-900
const SIDEBAR_TEXT      = '#9ca3af';   // gray-400
const SIDEBAR_ACTIVE    = '#f9fafb';   // gray-50
const SIDEBAR_ACTIVE_BG = 'rgba(255,255,255,0.08)';
const SIDEBAR_HOVER_BG  = 'rgba(255,255,255,0.04)';
const SIDEBAR_BORDER    = 'rgba(255,255,255,0.06)';

interface NavItem {
  label: string;
  to: string;
  end?: boolean;
  Icon: SvgIconComponent;
}

const NAV_LINKS: NavItem[] = [
  { label: 'Dashboard', to: '/',          end: true, Icon: DashboardIcon },
  { label: 'Employees', to: '/employees',            Icon: PeopleIcon    },
  { label: 'Insights',  to: '/insights',             Icon: BarChartIcon  },
];

export default function AppShell() {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Box
        component="nav"
        sx={{
          width: SIDEBAR_W,
          flexShrink: 0,
          bgcolor: SIDEBAR_BG,
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${SIDEBAR_BORDER}`,
        }}
      >
        {/* Logo / wordmark */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: `1px solid ${SIDEBAR_BORDER}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '5px',
              bgcolor: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: '#fff', fontSize: 11, fontWeight: 800, lineHeight: 1 }}>
              S
            </Typography>
          </Box>
          <Typography
            sx={{
              color: SIDEBAR_ACTIVE,
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: '-0.01em',
            }}
          >
            Salary Management
          </Typography>
        </Box>

        {/* Navigation */}
        <Box sx={{ flex: 1, py: 1.5, overflowY: 'auto' }}>
          {NAV_LINKS.map(({ label, to, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              {({ isActive }) => (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 0.875,
                    mx: 1,
                    borderRadius: '5px',
                    bgcolor: isActive ? SIDEBAR_ACTIVE_BG : 'transparent',
                    color: isActive ? SIDEBAR_ACTIVE : SIDEBAR_TEXT,
                    cursor: 'pointer',
                    transition: 'background-color 0.12s, color 0.12s',
                    '&:hover': {
                      bgcolor: isActive ? SIDEBAR_ACTIVE_BG : SIDEBAR_HOVER_BG,
                      color: SIDEBAR_ACTIVE,
                    },
                  }}
                >
                  <Icon sx={{ fontSize: 15, opacity: isActive ? 1 : 0.75 }} />
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: isActive ? 500 : 400,
                      lineHeight: 1.4,
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              )}
            </NavLink>
          ))}
        </Box>

        {/* Footer */}
        <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${SIDEBAR_BORDER}` }}>
          <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            v0.1.0
          </Typography>
        </Box>
      </Box>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
