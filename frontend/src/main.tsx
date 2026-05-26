import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { NotifyProvider } from './notifications/NotifyContext.tsx';
import theme from './theme.ts';

// queryClient is created outside render so it is stable across HMR
let _notifyError: ((msg: string) => void) | null = null;

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      _notifyError?.(error instanceof Error ? error.message : 'An unexpected error occurred');
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// Tiny bridge: NotifyProvider mounts after QueryClientProvider, so we can't
// pass notify directly into QueryCache. Instead we expose a setter that
// NotifyBridge (below) calls once the context is available.
export function setNotifyErrorBridge(fn: (msg: string) => void) {
  _notifyError = fn;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotifyProvider>
          <App />
        </NotifyProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
