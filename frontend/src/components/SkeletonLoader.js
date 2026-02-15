import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';

const PHASE_LABELS = {
  reading: 'Reading document...',
  analyzing: 'Analyzing Context...',
  formulating: 'Formulating Answer...',
};

export default function SkeletonLoader({ phase }) {
  return (
    <Box sx={{ px: 1, py: 0.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        {PHASE_LABELS[phase] || 'Processing...'}
      </Typography>
      <Skeleton variant="text" width="85%" />
      <Skeleton variant="text" width="70%" />
      <Skeleton variant="text" width="55%" />
    </Box>
  );
}
