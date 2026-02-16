import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Box, TextField, IconButton, Typography, LinearProgress, Chip, alpha, useTheme } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import TuneIcon from '@mui/icons-material/Tune';

import { useChatContext } from '../contexts/ChatContext';
import { useFile } from '../contexts/FileContext';
import { usePersona } from '../contexts/PersonaContext';
import { useHighlights } from '../contexts/HighlightsContext';

import ChatMessage from './ChatMessage';
import FileViewer from './FileViewer';
import QuickActions from './QuickActions';
import SkeletonLoader from './SkeletonLoader';
import VoiceInput from './VoiceInput';
import SuggestionChips from './SuggestionChips';
import SuggestedPrompts from './SuggestedPrompts';

export default function ChatPanel() {
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const {
    messages,
    addMessage,
    isLoading,
    streamingContent,
    setStreamingContent,
    setIsLoading,
    stopGeneration,
  } = useChatContext();
  const { file, fileType } = useFile();
  const { persona } = usePersona();
  const { scrollToHighlight } = useHighlights();
  const theme = useTheme();

  const [input, setInput] = useState('');
  const [showPrompts, setShowPrompts] = useState(true);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !file) || isLoading) return;

    const userMsg = input;
    setInput('');
    setShowPrompts(false);
    await addMessage(userMsg);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setInput((prev) => prev + (prev ? ' ' : '') + transcript);
  };

  // Combine messages with streaming content for display
  const displayMessages = useMemo(() => {
    if (!streamingContent) return messages;
    return [
      ...messages,
      {
        id: 'streaming-temp',
        role: 'assistant',
        content: streamingContent,
        isStreaming: true,
      },
    ];
  }, [messages, streamingContent]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#000000', color: '#E5E5E5', fontFamily: 'monospace' }}>

      {/* Header / Top Info */}
      <Box sx={{ p: 1, borderBottom: '1px solid #333333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#888888' }}>
          [ SESSION_ACTIVE ]
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#00FF00' }}>
            ONLINE
          </Typography>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {displayMessages.length === 0 && showPrompts ? (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
            <Box sx={{ textAlign: 'center', opacity: 0.7 }}>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700, mb: 1 }}>
                Input Required
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#888' }}>
                Awaiting commands or queries...
              </Typography>
            </Box>
            <SuggestedPrompts
              onSelect={(prompt) => {
                setInput(prompt);
                // Optional: auto-submit or just fill
              }}
            />
          </Box>
        ) : (
          displayMessages.map((msg, index) => (
            <Box
              key={msg.id || index}
              sx={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              {/* Custom Message Bubble for Brutalist Theme */}
              <Box
                sx={{
                  border: msg.role === 'user' ? '1px solid #E5E5E5' : '1px solid #333333',
                  bgcolor: msg.role === 'user' ? '#000000' : '#0D0D0D',
                  p: 1.5,
                  position: 'relative',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: -10,
                    left: 10,
                    bgcolor: '#000000',
                    px: 0.5,
                    fontFamily: 'monospace',
                    color: msg.role === 'user' ? '#E5E5E5' : '#888888',
                    fontSize: '0.7rem'
                  }}
                >
                  {msg.role === 'user' ? '[ USER ]' : '[ SYS ]'}
                </Typography>

                {/* Simplified Message Content Rendering */}
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {msg.content}
                </Typography>

                {msg.isStreaming && (
                  <Box sx={{ display: 'inline-block', ml: 1, width: 8, height: 16, bgcolor: '#00FF00', animation: 'blink 1s step-end infinite' }} />
                )}
              </Box>
            </Box>
          ))
        )}

        {isLoading && !streamingContent && (
          <Box sx={{ alignSelf: 'flex-start', maxWidth: '85%', border: '1px solid #333333', p: 2 }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#888' }}>[ PROCESSING REQUEST ]</Typography>
            <LinearProgress sx={{ mt: 1, bgcolor: '#333333', '& .MuiLinearProgress-bar': { bgcolor: '#00FF00' } }} />
          </Box>
        )}
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: '1px solid #333333', bgcolor: '#000000' }}>
        <SuggestionChips onSelect={(chip) => setInput(chip)} />

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            border: '1px solid #333333',
            p: 0.5, // Reduced padding tightens the look
            '&:focus-within': {
              border: '1px solid #E5E5E5'
            }
          }}
        >
          <Box sx={{ pl: 1, color: '#00FF00', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.2rem' }}>
            {'>'}
          </Box>
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="ENTER_COMMAND..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                fontFamily: 'monospace',
                color: '#E5E5E5',
                fontSize: '0.9rem',
                '& ::placeholder': { color: '#666', opacity: 1 }
              }
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {!isLoading ? (
              <IconButton
                type="submit"
                disabled={!input.trim()}
                sx={{
                  color: '#E5E5E5',
                  borderRadius: 0,
                  '&:hover': { bgcolor: '#333333' },
                  '&.Mui-disabled': { color: '#444' }
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            ) : (
              <IconButton
                onClick={stopGeneration}
                sx={{
                  color: '#FF0000',
                  borderRadius: 0,
                  '&:hover': { bgcolor: '#330000' }
                }}
              >
                <StopIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
          <VoiceInput onTranscript={handleVoiceTranscript} />
        </Box>
      </Box>

      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </Box>
  );
}
