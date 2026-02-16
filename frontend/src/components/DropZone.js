import React, { useState, useRef, useCallback } from 'react';
import { Box, Typography, LinearProgress, IconButton, Stack, alpha, useTheme } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ReplayIcon from '@mui/icons-material/Replay';
import { useFile } from '../contexts/FileContext';

function UploadStatusOverlay({ entry, index, onRetry }) {
  if (!entry || entry.uploadStatus === 'pending') return null;

  if (entry.uploadStatus === 'uploading') {
    return (
      <Box
        sx={{
          width: '100%',
          px: 2,
          py: 1,
          mt: 1,
          border: '1px solid #333333',
          bgcolor: '#0D0D0D',
        }}
      >
        <Typography variant="caption" sx={{ color: '#E5E5E5', fontFamily: 'monospace' }} noWrap>
          [UPLOADING] {entry.fileName}...
        </Typography>
        <LinearProgress
          variant="determinate"
          value={entry.uploadProgress}
          sx={{
            mt: 1,
            height: 4,
            bgcolor: '#333333',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#00FF00',
            },
          }}
        />
      </Box>
    );
  }

  if (entry.uploadStatus === 'complete') {
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          mt: 1,
          px: 1.5,
          py: 0.5,
          border: '1px solid #00FF00',
          bgcolor: 'rgba(0, 255, 0, 0.05)',
        }}
      >
        <Typography variant="caption" sx={{ color: '#00FF00', fontFamily: 'monospace' }} noWrap>
          [OK] {entry.fileName} UPLOADED
        </Typography>
      </Stack>
    );
  }

  if (entry.uploadStatus === 'error') {
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          mt: 1,
          px: 1,
          py: 0.5,
          border: '1px solid #FF0000',
          bgcolor: 'rgba(255, 0, 0, 0.05)',
        }}
      >
        <Typography variant="caption" sx={{ color: '#FF0000', fontFamily: 'monospace' }} noWrap>
          [ERROR] {entry.fileName} FAILED
        </Typography>
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onRetry(index); }}
          sx={{ ml: 'auto', color: '#FF0000', p: 0 }}
        >
          [RETRY]
        </IconButton>
      </Stack>
    );
  }

  return null;
}

export default function DropZone() {
  const { handleFileSelect, files, retryUpload } = useFile();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      handleFileSelect(e.dataTransfer.files[0]);
    },
    [handleFileSelect]
  );

  const hasFiles = files && files.length > 0;

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label="Upload Terminal"
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => fileInputRef.current?.click()}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        cursor: 'pointer',
        border: dragOver ? '1px solid #00FF00' : '1px solid #333333',
        bgcolor: dragOver ? '#0D0D0D' : '#000000',
        transition: 'all 0.1s ease',
        position: 'relative',
        m: 0,
      }}
    >
      {/* Decorative Grid Lines */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', bgcolor: '#333333' }} />
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', bgcolor: '#333333' }} />

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.mp3,.wav,.m4a,.webm,.ogg"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files[0])}
      />

      <Box
        sx={{
          width: 80,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #333333',
          mb: 3,
          color: dragOver ? '#00FF00' : '#888888',
        }}
      >
        <Typography variant="h3" sx={{ fontFamily: 'monospace', fontWeight: 300 }}>
          {dragOver ? '[+]' : '[^]'}
        </Typography>
      </Box>

      <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem', letterSpacing: '0.1em', color: '#E5E5E5', fontFamily: 'monospace' }}>
        UPLOAD_TARGET
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: '#666666', fontFamily: 'monospace' }}>
        DROP FILES OR CLICK TO INITIALIZE
      </Typography>

      <Box sx={{ mt: 4, display: 'flex', gap: 2, color: '#444444', fontSize: '0.75rem', fontFamily: 'monospace' }}>
        <span>PDF</span>
        <span>DOCX</span>
        <span>TXT</span>
        <span>IMG</span>
      </Box>

      {hasFiles && (
        <Box sx={{ width: '100%', maxWidth: 400, mt: 4, px: 2 }}>
          {files.map((entry, i) => (
            <UploadStatusOverlay
              key={entry.fileName + i}
              entry={entry}
              index={i}
              onRetry={retryUpload}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
