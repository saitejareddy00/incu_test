import { createTheme } from '@mui/material/styles';

/**
 *  - Neutral dark sidebar (#111827)
 *  - Near-white content background (#f9fafb)
 *  - Small, clean Inter typography — no uppercase buttons
 *  - Minimal border radius (6px), subtle shadows
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#111827', // gray-900 — matches Cursor sidebar
      light: '#374151',
      dark: '#030712',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6366f1', // indigo-500 — subtle accent
      contrastText: '#ffffff',
    },
    background: {
      default: '#f9fafb', // gray-50 — content area
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280', // gray-500
    },
    divider: '#e5e7eb', // gray-200
    success: { main: '#22c55e' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    info: { main: '#3b82f6' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
    button: { textTransform: 'none', fontWeight: 500 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
    body2: { fontSize: '0.8125rem' },
    caption: { fontSize: '0.75rem', color: '#6b7280' },
  },
  shape: { borderRadius: 6 },
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    ...Array(20).fill('none'),
  ] as import('@mui/material').Shadows,
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 6, fontSize: '0.8125rem', padding: '5px 14px' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        outlined: { borderColor: '#e5e7eb' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: '0.6875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#6b7280',
          borderBottom: '1px solid #e5e7eb',
          padding: '8px 16px',
        },
        body: { fontSize: '0.8125rem', padding: '10px 16px', borderColor: '#f3f4f6' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': { border: 0 },
          '&.MuiTableRow-hover:hover': { backgroundColor: '#f9fafb' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontSize: '0.75rem', height: 24, borderRadius: 4 },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: { fontSize: '0.8125rem' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: '#d1d5db' },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#f9fafb' },
      },
    },
  },
});

export default theme;
