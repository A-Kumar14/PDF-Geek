import React, { useState } from 'react';
import { IconButton, Tooltip, Typography, alpha } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
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
    <>
      <Tooltip title={feedback === 'up' ? 'Thanks!' : 'Helpful'} arrow>
        <IconButton
          size="small"
          onClick={() => handleFeedback('up')}
          sx={{
            color: feedback === 'up' ? '#10B981' : 'text.secondary',
            bgcolor: feedback === 'up' ? alpha('#10B981', 0.1) : 'transparent',
            '&:hover': { bgcolor: alpha('#10B981', 0.1) },
            p: 0.5,
          }}
        >
          {feedback === 'up' ? <ThumbUpIcon sx={{ fontSize: 16 }} /> : <ThumbUpOutlinedIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Tooltip>
      <Tooltip title={feedback === 'down' ? 'Thanks!' : 'Not helpful'} arrow>
        <IconButton
          size="small"
          onClick={() => handleFeedback('down')}
          sx={{
            color: feedback === 'down' ? '#EF4444' : 'text.secondary',
            bgcolor: feedback === 'down' ? alpha('#EF4444', 0.1) : 'transparent',
            '&:hover': { bgcolor: alpha('#EF4444', 0.1) },
            p: 0.5,
          }}
        >
          {feedback === 'down' ? <ThumbDownIcon sx={{ fontSize: 16 }} /> : <ThumbDownOutlinedIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Tooltip>
      {showThanks && (
        <Typography
          variant="caption"
          sx={{ color: '#10B981', fontSize: '0.7rem', fontWeight: 600, animation: 'fadeIn 0.2s ease' }}
        >
          Thanks!
        </Typography>
      )}
    </>
  );
}
