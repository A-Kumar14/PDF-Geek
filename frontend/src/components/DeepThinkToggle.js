import React from 'react';
import { Box, Switch, Tooltip, Typography } from '@mui/material';
import { useChatContext } from '../contexts/ChatContext';

export default function DeepThinkToggle() {
  const { deepThinkEnabled, toggleDeepThink } = useChatContext();

  return (
    <Tooltip title="DeepThink: More thorough analysis using more context and a stronger model">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.8 }}>
          DeepThink
        </Typography>
        <Switch size="small" checked={deepThinkEnabled} onChange={toggleDeepThink} />
      </Box>
    </Tooltip>
  );
}
