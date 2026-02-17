import React from 'react';
import { Box, Typography } from '@mui/material';
import { useChatContext } from '../contexts/ChatContext';

export default function SuggestionChips({ onSelect }) {
  const { suggestions, sendMessage } = useChatContext();

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Box sx={{ mb: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Typography variant="caption" sx={{ color: '#888', fontFamily: 'monospace', fontSize: '0.7rem' }}>
        SUGGESTED:
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {suggestions.map((s, i) => {
          const text = s.text || s;
          return (
            <Box
              key={i}
              onClick={() => {
                if (onSelect) onSelect(text);
                else sendMessage(text);
              }}
              sx={{
                border: '1px solid #333333',
                px: 1.5,
                py: 0.25,
                cursor: 'pointer',
                '&:hover': { borderColor: '#E5E5E5', bgcolor: '#0D0D0D' },
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#E5E5E5' }}>
                {text}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
