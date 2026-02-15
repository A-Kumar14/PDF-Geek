import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import NoteIcon from '@mui/icons-material/Note';
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
      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 0.5 }}>
        <ShareIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={handleExportNotion}>
          <ListItemIcon><CloudUploadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Export to Notion</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportMarkdown}>
          <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Download as Markdown (Obsidian)</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportEnex}>
          <ListItemIcon><NoteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Download for Evernote (.enex)</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
