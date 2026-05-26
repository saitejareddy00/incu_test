import CloseIcon from '@mui/icons-material/Close';
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import React from 'react';

interface Props {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
  headerVariant?: 'default' | 'gradient';
}

export function FormDialog({
  title,
  subtitle,
  open,
  onClose,
  children,
  maxWidth = 'sm',
  headerVariant = 'default',
}: Props) {
  const isGradient = headerVariant === 'gradient';

  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth scroll="paper">
      <DialogTitle
        sx={{
          pr: 6,
          pb: subtitle ? 1 : undefined,
          ...(isGradient && {
            background: 'linear-gradient(135deg, #111827 0%, #312e81 100%)',
            color: '#f9fafb',
          }),
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: isGradient ? '#fff' : 'inherit' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: isGradient ? '#9ca3af' : 'text.secondary' }}
          >
            {subtitle}
          </Typography>
        )}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: isGradient ? '#e5e7eb' : 'inherit',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2.5 }}>
        <Box>{children}</Box>
      </DialogContent>
    </Dialog>
  );
}
