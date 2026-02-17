import React, { useState, useRef, useCallback } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';

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
    if (isListening) stopListening();
    else startListening();
  };

  const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!supported) return null;

  return (
    <Tooltip title={isListening ? 'Stop listening' : 'Voice input'}>
      <Box
        onClick={disabled ? undefined : toggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          border: `1px solid ${isListening ? '#FF0000' : '#333333'}`,
          px: 1,
          py: 0.25,
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          '&:hover': disabled ? {} : { borderColor: isListening ? '#FF0000' : '#E5E5E5' },
        }}
      >
        <Typography sx={{
          fontSize: '0.7rem',
          fontFamily: 'monospace',
          fontWeight: 700,
          color: isListening ? '#FF0000' : '#888',
        }}>
          {isListening ? '[ REC... ]' : '[ MIC ]'}
        </Typography>
        {isListening && (
          <Box sx={{
            width: 6,
            height: 6,
            bgcolor: '#FF0000',
            animation: 'recordingPulse 1s infinite',
          }} />
        )}
      </Box>
    </Tooltip>
  );
}
