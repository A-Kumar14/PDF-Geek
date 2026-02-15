import React, { useState } from 'react';
import { IconButton, Tooltip, alpha } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import { sendFeedback } from '../api/sessions';

export default function FeedbackButtons({ messageId }) {
  const [feedback, setFeedback] = useState(null);

  if (!messageId) return null;

  const handleFeedback = async (type) => {
    if (feedback === type) return;
    setFeedback(type);
    try {
      await sendFeedback(messageId, type);
    } catch {
      // Revert on error
      setFeedback(null);
    }
  };

  return (
    <>
      <Tooltip title="Helpful" arrow>
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
      <Tooltip title="Not helpful" arrow>
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
    </>
  );
}
