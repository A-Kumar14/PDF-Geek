import React, { useState, useEffect } from 'react';
import { Box, Chip, alpha, useTheme } from '@mui/material';
import { Lightbulb, BookOpen, Search, ListChecks, BrainCircuit } from 'lucide-react';

const DEFAULT_PROMPTS = [
  { text: 'Summarize this document', icon: BookOpen },
  { text: 'Explain the main concepts', icon: Lightbulb },
  { text: 'Identify key takeaways', icon: Search },
];

const EXTENDED_PROMPTS = [
  { text: 'Create a study guide', icon: ListChecks },
  { text: 'Find important definitions', icon: Search },
  { text: 'Explain like I\'m a beginner', icon: BrainCircuit },
  { text: 'List the main arguments', icon: ListChecks },
  { text: 'What questions does this raise?', icon: Lightbulb },
];

export default function SuggestedPrompts({ onPromptSelected, dynamicPrompts }) {
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Update prompts when dynamic suggestions arrive from AI responses
  useEffect(() => {
    if (dynamicPrompts && dynamicPrompts.length > 0) {
      const mapped = dynamicPrompts.map((p) => {
        const text = typeof p === 'string' ? p : p.text || p;
        return { text, icon: Lightbulb };
      });
      setPrompts(mapped.slice(0, 4));
    }
  }, [dynamicPrompts]);

  // Rotate in a fresh default prompt after one is clicked
  const handleClick = (prompt) => {
    onPromptSelected(prompt.text);

    setPrompts((prev) => {
      const remaining = prev.filter((p) => p.text !== prompt.text);
      // Pick a replacement from the extended pool that isn't already showing
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
        gap: 1,
        overflowX: 'auto',
        pb: 0.5,
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {prompts.map((prompt) => {
        const Icon = prompt.icon;
        return (
          <Chip
            key={prompt.text}
            label={prompt.text}
            icon={<Icon size={14} strokeWidth={2} />}
            variant="outlined"
            clickable
            onClick={() => handleClick(prompt)}
            aria-label={`Suggested prompt: ${prompt.text}`}
            sx={{
              flexShrink: 0,
              fontSize: '0.8rem',
              fontWeight: 500,
              borderRadius: '20px',
              bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03),
              borderColor: theme.palette.divider,
              '&:hover': {
                bgcolor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.06),
              },
              transition: 'all 0.15s',
            }}
          />
        );
      })}
    </Box>
  );
}
