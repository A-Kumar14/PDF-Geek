import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

const PHASE_LABELS = {
  queued: 'QUEUED...',
  pending: 'QUEUED...',
  downloading: 'DOWNLOADING...',
  extracting: 'EXTRACTING_TEXT...',
  indexing: 'BUILDING_INDEX...',
  completed: 'COMPLETE',
  success: 'COMPLETE',
  failure: 'FAILED',
};

export default function DocumentIndexingProgress({ phase, progress }) {
  const label = PHASE_LABELS[phase] || 'PROCESSING...';
  const isComplete = phase === 'completed' || phase === 'success';
  const isFailed = phase === 'failure';

  return (
    <Box
      sx={{
        width: '100%',
        px: 2,
        py: 1,
        border: `1px solid ${isFailed ? '#FF0000' : '#333333'}`,
        bgcolor: '#0D0D0D',
      }}
    >
      <Typography
        sx={{
          fontFamily: 'monospace',
          fontWeight: 700,
          fontSize: '0.75rem',
          color: isFailed ? '#FF0000' : isComplete ? '#00FF00' : '#888',
        }}
      >
        [ {label} ]
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progress}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Document indexing: ${label}`}
        sx={{
          mt: 0.5,
          height: 4,
          bgcolor: '#333333',
          '& .MuiLinearProgress-bar': {
            bgcolor: isFailed ? '#FF0000' : '#00FF00',
          },
        }}
      />
    </Box>
  );
}
