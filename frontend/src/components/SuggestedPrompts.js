import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

const DEFAULT_PROMPTS = [
  { text: 'Summarize this document' },
  { text: 'Explain the main concepts' },
  { text: 'Identify key takeaways' },
];

const EXTENDED_PROMPTS = [
  { text: 'Create a study guide' },
  { text: 'Find important definitions' },
  { text: 'Explain like I\'m a beginner' },
  { text: 'List the main arguments' },
  { text: 'What questions does this raise?' },
];

export default function SuggestedPrompts({ onSelect, onPromptSelected, dynamicPrompts }) {
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);

  useEffect(() => {
    if (dynamicPrompts && dynamicPrompts.length > 0) {
      const mapped = dynamicPrompts.map((p) => {
        const text = typeof p === 'string' ? p : p.text || p;
        return { text };
      });
      setPrompts(mapped.slice(0, 4));
    }
  }, [dynamicPrompts]);

  const handleClick = (prompt) => {
    if (onSelect) onSelect(prompt.text);
    if (onPromptSelected) onPromptSelected(prompt.text);

    setPrompts((prev) => {
      const remaining = prev.filter((p) => p.text !== prompt.text);
      const showing = new Set(remaining.map((p) => p.text));
      const replacement = EXTENDED_PROMPTS.find((p) => !showing.has(p.text));
      if (replacement) {
        return [...remaining, replacement];
      }
      return remaining;
    });
  };

  if (prompts.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        justifyContent: 'center',
        px: 2,
      }}
    >
      {prompts.map((prompt) => (
        <Box
          key={prompt.text}
          onClick={() => handleClick(prompt)}
          sx={{
            border: '1px solid #333333',
            px: 2,
            py: 1,
            cursor: 'pointer',
            '&:hover': {
              borderColor: '#E5E5E5',
              bgcolor: '#0D0D0D',
            },
          }}
        >
          <Typography sx={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#E5E5E5' }}>
            {'> '}{prompt.text}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
