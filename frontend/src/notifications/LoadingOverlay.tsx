import { Backdrop, CircularProgress } from '@mui/material';

interface Props {
  open: boolean;
}

export function LoadingOverlay({ open }: Props) {
  if (!open) return null;
  return (
    <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: '#fff' }}>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
}
