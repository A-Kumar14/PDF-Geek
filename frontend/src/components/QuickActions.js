import React from 'react';
import { Box, Chip } from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import SummarizeIcon from '@mui/icons-material/Summarize';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import PersonIcon from '@mui/icons-material/Person';
import { useChatContext } from '../contexts/ChatContext';
import { usePersona } from '../contexts/PersonaContext';
import { useFile } from '../contexts/FileContext';

export default function QuickActions() {
  const { sendMessage, loading } = useChatContext();
  const { persona } = usePersona();
  const { fileType } = useFile();

  const actions = [
    { label: 'Make Quiz', icon: <QuizIcon fontSize="small" /> },
    { label: 'Summarize', icon: <SummarizeIcon fontSize="small" /> },
    ...(fileType === 'image'
      ? [{ label: 'Analyze Image', icon: <ImageSearchIcon fontSize="small" /> }]
      : []),
    {
      label: `Explain like ${persona.label}`,
      icon: <PersonIcon fontSize="small" />,
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 2 }}>
      {actions.map(({ label, icon }) => (
        <Chip
          key={label}
          label={label}
          icon={icon}
          variant="outlined"
          clickable
          disabled={loading}
          onClick={() => sendMessage(label)}
          sx={{ fontWeight: 500 }}
        />
      ))}
    </Box>
  );
}
