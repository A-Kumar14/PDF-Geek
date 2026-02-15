import React, { useRef, useEffect, useState } from 'react';
import { Box, TextField, IconButton, Typography, Paper, alpha, useTheme } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useChatContext } from '../contexts/ChatContext';
import { useFile } from '../contexts/FileContext';
import { usePersona } from '../contexts/PersonaContext';
import ChatMessage from './ChatMessage';
import QuickActions from './QuickActions';
import SkeletonLoader from './SkeletonLoader';
import VoiceInput from './VoiceInput';
import SuggestionChips from './SuggestionChips';

export default function ChatPanel() {
  const { messages, loading, loadingPhase, sendMessage, suggestions } = useChatContext();
  const { file } = useFile();
  const { persona } = usePersona();
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !file || loading) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              px: 3,
            }}
          >
            {/* Accent icon */}
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.12 : 0.08),
                mb: 2.5,
              }}
            >
              {file
                ? <AutoAwesomeIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                : <UploadFileIcon sx={{ fontSize: 28, color: 'primary.main' }} />}
            </Box>

            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ letterSpacing: '-0.01em', mb: 0.5 }}
            >
              {file ? 'Ready to analyze' : 'Welcome to FileGeek'}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 280, lineHeight: 1.6, mb: 2.5 }}
            >
              {file
                ? persona.greeting
                : 'Drop a PDF, image, or document to start an AI-powered conversation.'}
            </Typography>

            {file && <QuickActions />}
          </Box>
        )}

        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
            <Paper
              elevation={0}
              sx={{
                maxWidth: '72%',
                px: 2,
                py: 1.2,
                borderRadius: '12px',
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <SkeletonLoader phase={loadingPhase} />
            </Paper>
          </Box>
        )}

        {/* Suggestion chips at bottom of chat */}
        {!loading && suggestions?.length > 0 && (
          <Box sx={{ px: 1, pb: 1 }}>
            <SuggestionChips suggestions={suggestions} />
          </Box>
        )}

        <div ref={chatEndRef} />
      </Box>

      {/* Input bar */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          gap: 1,
          p: 1.5,
          borderTop: `1px solid ${theme.palette.divider}`,
          alignItems: 'flex-end',
        }}
      >
        <VoiceInput onTranscript={handleVoiceTranscript} disabled={!file || loading} />
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder={file ? 'Ask a question...' : 'Upload a file first'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!file || loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              fontSize: '0.9rem',
            },
          }}
        />
        <IconButton
          type="submit"
          color="primary"
          disabled={!file || !inputText.trim() || loading}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'scale(1.05)',
            },
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground',
              color: 'action.disabled',
            },
            borderRadius: '10px',
            px: 2,
            transition: 'all 0.15s ease',
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
