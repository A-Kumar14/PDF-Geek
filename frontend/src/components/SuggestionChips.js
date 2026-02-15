import React from 'react';
import { Box, Chip, Typography, alpha, useTheme } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useChatContext } from '../contexts/ChatContext';

export default function SuggestionChips({ suggestions }) {
  const { sendMessage } = useChatContext();
  const theme = useTheme();

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <AutoAwesomeIcon sx={{ fontSize: 14 }} />
        Try asking:
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {suggestions.map((s, i) => (
          <Chip
            key={i}
            label={s.text || s}
            size="small"
            variant="outlined"
            onClick={() => sendMessage(s.text || s)}
            sx={{
              cursor: 'pointer',
              borderRadius: '8px',
              fontSize: '0.8rem',
              borderColor: alpha(theme.palette.primary.main, 0.3),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                borderColor: theme.palette.primary.main,
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
