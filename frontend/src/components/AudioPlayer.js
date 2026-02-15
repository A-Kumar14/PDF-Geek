import React, { useState, useRef } from 'react';
import { IconButton, CircularProgress } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';
import apiClient from '../api/client';

export default function AudioPlayer({ text }) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const handlePlay = async () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlaying(false);
      return;
    }

    setLoading(true);
    try {
      const trimmed = text.slice(0, 4096);
      const res = await apiClient.post('/tts', { text: trimmed }, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(res.data);
      const audio = new Audio(blobUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlaying(false);
        URL.revokeObjectURL(blobUrl);
      };

      await audio.play();
      setPlaying(true);
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!text) return null;

  return (
    <IconButton size="small" onClick={handlePlay} disabled={loading} sx={{ ml: 0.5 }}>
      {loading ? (
        <CircularProgress size={16} />
      ) : playing ? (
        <StopIcon fontSize="small" />
      ) : (
        <VolumeUpIcon fontSize="small" />
      )}
    </IconButton>
  );
}
