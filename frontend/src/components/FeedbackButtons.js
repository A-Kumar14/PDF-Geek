import React, { useState } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { sendFeedback } from '../api/sessions';

export default function FeedbackButtons({ messageId }) {
  const [feedback, setFeedback] = useState(null);
  const [showThanks, setShowThanks] = useState(false);

  if (!messageId) return null;

  const handleFeedback = async (type) => {
    if (feedback === type) return;
    setFeedback(type);
    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 2000);
    try {
      await sendFeedback(messageId, type);
    } catch {
      setFeedback(null);
      setShowThanks(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Tooltip title={feedback === 'up' ? 'Recorded' : 'Helpful'}>
        <Box
          onClick={() => handleFeedback('up')}
          sx={{
            cursor: 'pointer',
            color: feedback === 'up' ? '#00FF00' : '#888',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            fontWeight: 700,
            '&:hover': { color: '#00FF00' },
          }}
        >
          [+]
        </Box>
      </Tooltip>
      <Tooltip title={feedback === 'down' ? 'Recorded' : 'Not helpful'}>
        <Box
          onClick={() => handleFeedback('down')}
          sx={{
            cursor: 'pointer',
            color: feedback === 'down' ? '#FF0000' : '#888',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            fontWeight: 700,
            '&:hover': { color: '#FF0000' },
          }}
        >
          [-]
        </Box>
      </Tooltip>
      {showThanks && (
        <Typography sx={{ color: '#00FF00', fontSize: '0.65rem', fontFamily: 'monospace' }}>
          OK
        </Typography>
      )}
    </Box>
  );
}
