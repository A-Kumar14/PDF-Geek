import React from 'react';
import { Box, Typography } from '@mui/material';
import { useChatContext } from '../contexts/ChatContext';
import { usePersona } from '../contexts/PersonaContext';
import { useFile } from '../contexts/FileContext';

export default function QuickActions() {
  const { sendMessage, loading } = useChatContext();
  const { persona } = usePersona();
  const { fileType } = useFile();

  const actions = [
    'Make Quiz',
    'Summarize',
    ...(fileType === 'image' ? ['Analyze Image'] : []),
    `Explain like ${persona.label}`,
  ];

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mt: 1 }}>
      {actions.map((label) => (
        <Box
          key={label}
          onClick={() => !loading && sendMessage(label)}
          sx={{
            border: '1px solid #333333',
            px: 1.5,
            py: 0.5,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.5 : 1,
            '&:hover': loading ? {} : { borderColor: '#E5E5E5', bgcolor: '#0D0D0D' },
          }}
        >
          <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#E5E5E5' }}>
            {'> '}{label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
