import { Alert } from '@mui/material';

interface Props {
  message: string;
}

export function ErrorBanner({ message }: Props) {
  if (!message) return null;
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {message}
    </Alert>
  );
}
