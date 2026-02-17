import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

const PHASE_LABELS = {
  reading: 'READING_DOCUMENT...',
  analyzing: 'ANALYZING_CONTEXT...',
  formulating: 'FORMULATING_ANSWER...',
};

export default function SkeletonLoader({ phase }) {
  return (
    <Box sx={{ px: 1, py: 1 }}>
      <Typography sx={{ color: '#888', fontFamily: 'monospace', fontSize: '0.75rem', mb: 1 }}>
        [ {PHASE_LABELS[phase] || 'PROCESSING...'} ]
      </Typography>
      <LinearProgress sx={{ bgcolor: '#333333', '& .MuiLinearProgress-bar': { bgcolor: '#00FF00' } }} />
    </Box>
  );
}
