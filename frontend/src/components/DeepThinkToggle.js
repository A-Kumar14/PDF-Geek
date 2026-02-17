import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { useChatContext } from '../contexts/ChatContext';

export default function DeepThinkToggle() {
  const { deepThinkEnabled, toggleDeepThink } = useChatContext();

  return (
    <Tooltip title="DeepThink: More thorough analysis">
      <Box
        onClick={toggleDeepThink}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          border: '1px solid #333333',
          px: 1,
          py: 0.25,
          '&:hover': { borderColor: '#E5E5E5' },
        }}
      >
        <Typography sx={{
          fontSize: '0.7rem',
          fontFamily: 'monospace',
          fontWeight: 700,
          color: deepThinkEnabled ? '#00FF00' : '#888',
        }}>
          [ DEEP {deepThinkEnabled ? 'ON' : 'OFF'} ]
        </Typography>
      </Box>
    </Tooltip>
  );
}
