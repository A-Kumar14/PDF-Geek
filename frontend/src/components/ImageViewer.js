import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export default function ImageViewer({ file }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setDataUrl(e.target.result);
    reader.readAsDataURL(file);
  }, [file]);

  if (!dataUrl) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography color="text.secondary">Loading image...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 0.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }} noWrap>
          {file.name}
        </Typography>
        <IconButton size="small" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}>
          <ZoomOutIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption">{Math.round(zoom * 100)}%</Typography>
        <IconButton size="small" onClick={() => setZoom((z) => Math.min(4, z + 0.25))}>
          <ZoomInIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => setZoom(1)}>
          <RestartAltIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Image */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <img
          src={dataUrl}
          alt={file.name}
          style={{
            maxWidth: `${zoom * 100}%`,
            height: 'auto',
            transition: 'max-width 0.2s',
            borderRadius: 4,
          }}
        />
      </Box>
    </Box>
  );
}
