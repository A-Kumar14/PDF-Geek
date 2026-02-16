import React from 'react';
import { Box, LinearProgress, Typography, alpha, useTheme } from '@mui/material';

const PHASE_LABELS = {
  queued: 'Queued...',
  pending: 'Queued...',
  downloading: 'Downloading...',
  extracting: 'Extracting text...',
  indexing: 'Building index...',
  completed: 'Complete',
  success: 'Complete',
  failure: 'Failed',
};

export default function DocumentIndexingProgress({ phase, progress }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const label = PHASE_LABELS[phase] || 'Processing...';
  const isComplete = phase === 'completed' || phase === 'success';
  const isFailed = phase === 'failure';

  return (
    <Box
      sx={{
        width: '100%',
        px: 2,
        py: 1.5,
        borderRadius: '10px',
        bgcolor: isFailed
          ? alpha('#EF4444', isDark ? 0.1 : 0.06)
          : alpha(theme.palette.primary.main, isDark ? 0.08 : 0.05),
        border: `1px solid ${
          isFailed
            ? alpha('#EF4444', 0.15)
            : alpha(theme.palette.primary.main, 0.1)
        }`,
      }}
    >
      <Typography
        variant="caption"
        color={isFailed ? 'error' : 'text.secondary'}
        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
      >
        {label}
      </Typography>
      <LinearProgress
        variant={isComplete || isFailed ? 'determinate' : 'determinate'}
        value={progress}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Document indexing: ${label}`}
        sx={{
          mt: 0.5,
          borderRadius: 3,
          height: 6,
          bgcolor: alpha(
            isFailed ? '#EF4444' : theme.palette.primary.main,
            0.1
          ),
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
            bgcolor: isFailed ? '#EF4444' : undefined,
            transition: 'transform 0.4s ease',
          },
        }}
      />
    </Box>
  );
}
