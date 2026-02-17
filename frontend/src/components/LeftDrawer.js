import React, { useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Drawer,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import ImageIcon from '@mui/icons-material/Image';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';

import { useAuth } from '../contexts/AuthContext';
import { useFile } from '../contexts/FileContext';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  { key: 'all', label: 'ALL FILES', icon: <FolderIcon fontSize="small" />, types: [] }, // Empty types = all
  { key: 'pdf', label: 'PDFs', icon: <DescriptionIcon fontSize="small" />, types: ['pdf'] },
  { key: 'image', label: 'IMAGES', icon: <ImageIcon fontSize="small" />, types: ['image'] },
  { key: 'document', label: 'DOCS', icon: <DescriptionIcon fontSize="small" />, types: ['docx', 'txt'] },
];

function DrawerContent({ onClose }) {
  const { logout } = useAuth();
  const { files, activeFileIndex, setActiveFileIndex, handleFileSelect } = useFile();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState({ all: true });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter files based on search and section type
  const getFilteredFiles = (types) => {
    return files.filter((f) => {
      const matchesSearch = (f.name || f.fileName || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (types.length === 0) return true; // 'all'
      // Simple type check mapping
      const ext = (f.name || f.fileName || '').split('.').pop().toLowerCase();
      if (types.includes('image') && ['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return true;
      if (types.includes('pdf') && ext === 'pdf') return true;
      if (types.includes('docx') && ext === 'docx') return true;
      if (types.includes('txt') && ext === 'txt') return true;
      return false;
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleHome = () => {
    navigate('/');
    if (onClose) onClose();
  };

  const commonListItemSx = {
    py: 0.5,
    px: 2,
    borderLeft: '2px solid transparent',
    '&:hover': {
      bgcolor: '#333333',
      color: '#FFFFFF',
      '& .MuiListItemIcon-root': { color: '#FFFFFF' },
    },
    '&.Mui-selected': {
      bgcolor: '#333333',
      borderLeft: '2px solid #00FF00',
      color: '#00FF00',
      '&:hover': { bgcolor: '#444444' },
      '& .MuiListItemIcon-root': { color: '#00FF00' },
    },
    transition: 'none',
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#000000', color: '#E5E5E5', fontFamily: 'monospace' }}>

      {/* Header Area */}
      <Box sx={{ p: 2, borderBottom: '1px solid #333333' }}>
        <Typography variant="h6" sx={{ color: '#E5E5E5', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'monospace' }}>
          FileGeek
        </Typography>
        <Typography variant="caption" sx={{ color: '#888888', fontFamily: 'monospace' }}>
          Your Study Sessions
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ p: 2, borderBottom: '1px solid #333333' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #333333', px: 1 }}>
          <SearchIcon sx={{ color: '#888', fontSize: 20, mr: 1 }} />
          <input
            type="text"
            placeholder="SEARCH_FILES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#E5E5E5',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              width: '100%',
              padding: '8px 0',
              outline: 'none',
            }}
          />
        </Box>
      </Box>

      {/* File List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List sx={{ pt: 0 }}>
          {SECTIONS.map((section) => {
            const sectionFiles = getFilteredFiles(section.types);
            if (section.key !== 'all' && sectionFiles.length === 0) return null;

            return (
              <React.Fragment key={section.key}>
                <ListItemButton onClick={() => toggleSection(section.key)} sx={commonListItemSx}>
                  <ListItemIcon sx={{ minWidth: 32, color: '#888' }}>
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={section.label}
                    primaryTypographyProps={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.875rem'
                    }}
                  />
                  {openSections[section.key] ? <ExpandLess sx={{ fontSize: 16, color: '#888' }} /> : <ExpandMore sx={{ fontSize: 16, color: '#888' }} />}
                </ListItemButton>

                <Collapse in={openSections[section.key]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {sectionFiles.map((f, idx) => {
                      // Find the actual index in the global files array
                      // This is a bit inefficient but safe for now
                      const globalIndex = files.indexOf(f);
                      const isSelected = globalIndex === activeFileIndex;

                      return (
                        <ListItemButton
                          key={idx}
                          selected={isSelected}
                          onClick={() => {
                            setActiveFileIndex(globalIndex);
                            if (onClose) onClose();
                          }}
                          sx={{
                            ...commonListItemSx,
                            pl: 6,
                            py: 0.25,
                          }}
                        >
                          <ListItemText
                            primary={f.fileName || f.name}
                            primaryTypographyProps={{
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              noWrap: true,
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                    {sectionFiles.length === 0 && (
                      <Typography sx={{ pl: 6, py: 1, color: '#555', fontSize: '0.75rem', fontStyle: 'italic', fontFamily: 'monospace' }}>
                        [NO FILES]
                      </Typography>
                    )}
                  </List>
                </Collapse>
                <Divider sx={{ borderColor: '#222' }} />
              </React.Fragment>
            );
          })}
        </List>
      </Box>

      {/* Footer Controls */}
      <Box sx={{ p: 0, borderTop: '1px solid #333333' }}>
        <ListItemButton onClick={handleHome} sx={commonListItemSx}>
          <ListItemIcon sx={{ minWidth: 32, color: '#888' }}><HomeIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="[DASHBOARD]" primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.875rem' }} />
        </ListItemButton>
        <ListItemButton onClick={handleLogout} sx={commonListItemSx}>
          <ListItemIcon sx={{ minWidth: 32, color: '#888' }}><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="[LOGOUT]" primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.875rem' }} />
        </ListItemButton>
        <Box sx={{ p: 2 }}>
          <label htmlFor="sidebar-upload-input">
            <input
              id="sidebar-upload-input"
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
            <Box
              sx={{
                border: '1px solid #333333',
                color: '#E5E5E5',
                textAlign: 'center',
                py: 1,
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: '#333333',
                  borderColor: '#E5E5E5'
                },
                fontFamily: 'monospace'
              }}
            >
              [ UPLOAD NEW FILE ]
            </Box>
          </label>
        </Box>
      </Box>
    </Box>
  );
}

export default function LeftDrawer({ open, onClose, embedded }) {
  // If embedded (desktop), just render content without Drawer wrapper
  if (embedded) {
    return <DrawerContent onClose={onClose} />;
  }

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 280, bgcolor: '#000000', color: '#E5E5E5' }
      }}
    >
      <DrawerContent onClose={onClose} />
    </Drawer>
  );
}
