import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { useFile } from '../contexts/FileContext';

export default function SmartCitation({ source }) {
  const { goToPage } = useFile();

  const pages = source.pages || [];
  const pageLabel = pages.length
    ? `p.${pages[0]}${pages.length > 1 ? '-' + pages[pages.length - 1] : ''}`
    : `#${source.index}`;

  const excerpt = source.excerpt
    ? source.excerpt.slice(0, 120) + (source.excerpt.length > 120 ? '...' : '')
    : '';

  return (
    <Tooltip title={excerpt || `Source ${source.index}`}>
      <Box
        onClick={() => pages[0] && goToPage(pages[0])}
        component="span"
        sx={{
          display: 'inline-block',
          border: '1px solid #333333',
          px: 0.75,
          py: 0.25,
          mr: 0.5,
          mb: 0.5,
          cursor: pages[0] ? 'pointer' : 'default',
          '&:hover': pages[0] ? { borderColor: '#00FF00', color: '#00FF00' } : {},
        }}
      >
        <Typography component="span" sx={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#888' }}>
          [{pageLabel}]
        </Typography>
      </Box>
    </Tooltip>
  );
}
