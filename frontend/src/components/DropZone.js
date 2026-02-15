import React, { useState, useRef, useCallback } from 'react';
import { Box, Typography, LinearProgress, IconButton, Stack, alpha, useTheme } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ReplayIcon from '@mui/icons-material/Replay';
import { useFile } from '../contexts/FileContext';

function UploadStatusOverlay({ entry, index, onRetry }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!entry || entry.uploadStatus === 'pending') return null;

  if (entry.uploadStatus === 'uploading') {
    return (
      <Box
        sx={{
          width: '100%',
          px: 2,
          py: 1,
          mt: 0.5,
          borderRadius: '8px',
          bgcolor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.05),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Typography variant="caption" color="text.secondary" noWrap>
          Uploading {entry.fileName}...
        </Typography>
        <LinearProgress
          variant="determinate"
          value={entry.uploadProgress}
          sx={{
            mt: 0.5,
            borderRadius: 3,
            height: 4,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
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
        spacing={0.5}
        sx={{
          mt: 0.5,
          px: 1.5,
          py: 0.5,
          borderRadius: '8px',
          bgcolor: alpha('#10B981', isDark ? 0.1 : 0.06),
          border: `1px solid ${alpha('#10B981', 0.15)}`,
        }}
      >
        <CheckCircleIcon sx={{ color: '#10B981', fontSize: 16 }} />
        <Typography variant="caption" sx={{ color: '#10B981' }} noWrap>
          {entry.fileName} uploaded
        </Typography>
      </Stack>
    );
  }

  if (entry.uploadStatus === 'error') {
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{
          mt: 0.5,
          px: 1.5,
          py: 0.5,
          borderRadius: '8px',
          bgcolor: alpha('#EF4444', isDark ? 0.1 : 0.06),
          border: `1px solid ${alpha('#EF4444', 0.15)}`,
        }}
      >
        <ErrorIcon sx={{ color: '#EF4444', fontSize: 16 }} />
        <Typography variant="caption" sx={{ color: '#EF4444' }} noWrap>
          {entry.fileName} failed
        </Typography>
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onRetry(index); }}
          sx={{ ml: 'auto', color: '#EF4444' }}
        >
          <ReplayIcon sx={{ fontSize: 16 }} />
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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

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
        border: '2px dashed',
        borderColor: dragOver
          ? 'primary.main'
          : alpha(isDark ? '#E5E7EB' : '#94A3B8', 0.25),
        borderRadius: '12px',
        m: 2,
        transition: 'all 0.25s ease',
        bgcolor: dragOver
          ? alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04)
          : 'transparent',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.5),
          bgcolor: alpha(theme.palette.primary.main, isDark ? 0.06 : 0.03),
        },
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.mp3,.wav,.m4a,.webm,.ogg"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files[0])}
      />

      {/* Icon with accent background */}
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.primary.main, isDark ? 0.12 : 0.08),
          mb: 2,
          transition: 'transform 0.2s ease',
          ...(dragOver && { transform: 'scale(1.1)' }),
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 32, color: 'primary.main' }} />
      </Box>

      <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem', letterSpacing: '-0.01em' }}>
        Drop a file here or click to browse
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        PDF, Word, Text, Images, and Audio (max 10 MB)
      </Typography>

      {hasFiles && (
        <Box sx={{ width: '100%', maxWidth: 360, mt: 2, px: 2 }}>
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
