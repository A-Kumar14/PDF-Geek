import React, { useState } from 'react';
import { Box, Menu, MenuItem, ListItemText, Tooltip } from '@mui/material';
import apiClient from '../api/client';

export default function ExportMenu({ content, title }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleExportNotion = async () => {
    setAnchorEl(null);
    try {
      const notionToken = localStorage.getItem('filegeek-notion-token');
      if (!notionToken) {
        alert('Please set your Notion integration token in Settings first.');
        return;
      }
      const res = await apiClient.post(
        '/export/notion',
        { title: title || 'FileGeek Export', content },
        { headers: { 'X-Notion-Token': notionToken } }
      );
      if (res.data.url) {
        alert(`Exported to Notion! Page: ${res.data.url}`);
      } else {
        alert('Exported to Notion successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to export to Notion.');
    }
  };

  const handleExportMarkdown = async () => {
    setAnchorEl(null);
    try {
      const res = await apiClient.post(
        '/export/markdown',
        { title: title || 'FileGeek Export', content },
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'export'}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to export as Markdown.');
    }
  };

  const handleExportEnex = async () => {
    setAnchorEl(null);
    try {
      const res = await apiClient.post(
        '/export/enex',
        { title: title || 'FileGeek Export', content },
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'export'}.enex`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to export as ENEX.');
    }
  };

  if (!content) return null;

  return (
    <>
      <Tooltip title="Export">
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            cursor: 'pointer',
            color: '#888',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            fontWeight: 700,
            '&:hover': { color: '#E5E5E5' },
          }}
        >
          [EXP]
        </Box>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={handleExportNotion}>
          <ListItemText primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {'> '}NOTION
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportMarkdown}>
          <ListItemText primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {'> '}MARKDOWN
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportEnex}>
          <ListItemText primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {'> '}EVERNOTE
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
