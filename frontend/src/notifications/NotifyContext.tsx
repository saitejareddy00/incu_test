import { Alert, Snackbar } from '@mui/material';
import React, { createContext, useCallback, useContext, useState } from 'react';

type Severity = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  severity: Severity;
}

interface NotifyContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const NotifyContext = createContext<NotifyContextValue | null>(null);

let nextId = 1;

export function NotifyProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, severity: Severity) => {
    setToasts((prev) => [...prev, { id: nextId++, message, severity }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value: NotifyContextValue = {
    success: (msg) => push(msg, 'success'),
    error:   (msg) => push(msg, 'error'),
    info:    (msg) => push(msg, 'info'),
    warning: (msg) => push(msg, 'warning'),
  };

  return (
    <NotifyContext.Provider value={value}>
      {children}
      {toasts.map((t) => (
        <Snackbar
          key={t.id}
          open
          autoHideDuration={4000}
          onClose={() => dismiss(t.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={t.severity} onClose={() => dismiss(t.id)} variant="filled">
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </NotifyContext.Provider>
  );
}

export function useNotify(): NotifyContextValue {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error('useNotify must be used inside <NotifyProvider>');
  return ctx;
}
