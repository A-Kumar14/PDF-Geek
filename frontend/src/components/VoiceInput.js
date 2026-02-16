import React, { useState, useRef, useCallback } from 'react';
import { Box, IconButton, Tooltip, Typography, keyframes } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
`;

export default function VoiceInput({ onTranscript, disabled }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onTranscript && transcript.trim()) {
        onTranscript(transcript.trim());
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const toggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Check for browser support
  const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!supported) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Tooltip title={isListening ? 'Stop listening' : 'Voice input'} arrow>
        <IconButton
          size="small"
          onClick={toggle}
          disabled={disabled}
          sx={{
            color: isListening ? '#EF4444' : 'text.secondary',
            animation: isListening ? `${pulse} 1.5s infinite` : 'none',
            '&:hover': { color: isListening ? '#DC2626' : 'primary.main' },
          }}
        >
          {isListening ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      {isListening && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FiberManualRecordIcon sx={{ fontSize: 8, color: '#EF4444', animation: 'recordingPulse 1s infinite' }} />
          <Typography variant="caption" sx={{ color: '#EF4444', fontSize: '0.7rem', fontWeight: 600 }}>
            Listening...
          </Typography>
        </Box>
      )}
    </Box>
  );
}
