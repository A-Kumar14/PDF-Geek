import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
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
    <Tooltip title={excerpt || `Source ${source.index}`} arrow>
      <Chip
        label={pageLabel}
        size="small"
        variant="outlined"
        clickable
        icon={<ArticleIcon fontSize="small" />}
        onClick={() => pages[0] && goToPage(pages[0])}
        sx={{ mr: 0.5, mb: 0.5 }}
      />
    </Tooltip>
  );
}
