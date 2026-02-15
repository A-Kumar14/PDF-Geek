import React, { useState, useMemo } from 'react';
import {
  Drawer,
  Box,
  Avatar,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { useFile } from '../contexts/FileContext';

const DRAWER_WIDTH = 280;

const FILE_TYPE_SECTIONS = [
  { key: 'pdf', label: 'PDFs', icon: <PictureAsPdfIcon fontSize="small" />, types: ['pdf', undefined] },
  { key: 'image', label: 'Images', icon: <ImageIcon fontSize="small" />, types: ['image'] },
  { key: 'document', label: 'Documents', icon: <DescriptionIcon fontSize="small" />, types: ['docx', 'txt'] },
];

function DrawerContent({ onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { chatSessions, activeSessionId, loadSession, clearMessages } = useChatContext();
  const { removeFile } = useFile();

  const [expandedSections, setExpandedSections] = useState({ pdf: true, image: true, document: true });

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const groupedSessions = useMemo(() => {
    const groups = { pdf: [], image: [], document: [] };
    chatSessions.forEach((session) => {
      const ft = session.fileType;
      if (ft === 'image') {
        groups.image.push(session);
      } else if (ft === 'docx' || ft === 'txt') {
        groups.document.push(session);
      } else {
        groups.pdf.push(session);
      }
    });
    return groups;
  }, [chatSessions]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleHome = () => {
    removeFile();
    clearMessages();
  };

  return (
    <>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.9rem' }}>
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.name || user?.email || 'User'}
            </Typography>
            {user?.name && user?.email && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            )}
          </Box>
        </Box>
        <Divider />
      </Box>

      <List dense>
        <ListItemButton onClick={handleHome}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <HomeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItemButton>
      </List>
      <Divider />

      {/* Smart Folder Chat History */}
      <Box sx={{ px: 2, pt: 1.5 }}>
        <Typography variant="overline" color="text.secondary">
          Chat History
        </Typography>
      </Box>

      {chatSessions.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2, textAlign: 'center' }}>
          No conversations yet
        </Typography>
      )}

      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        {FILE_TYPE_SECTIONS.map(({ key, label, icon }) => {
          const sessions = groupedSessions[key] || [];
          if (sessions.length === 0) return null;

          return (
            <React.Fragment key={key}>
              <ListItemButton onClick={() => toggleSection(key)} sx={{ borderRadius: 1, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>{icon}</ListItemIcon>
                <ListItemText
                  primary={`${label} (${sessions.length})`}
                  primaryTypographyProps={{ variant: 'caption', fontWeight: 600 }}
                />
                {expandedSections[key] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </ListItemButton>
              <Collapse in={expandedSections[key]} timeout="auto">
                <List dense disablePadding>
                  {sessions.map((session) => (
                    <ListItemButton
                      key={session.id}
                      selected={session.id === activeSessionId}
                      onClick={() => loadSession(session.id)}
                      sx={{ borderRadius: 1, mb: 0.5, pl: 4 }}
                    >
                      <ListItemText
                        primary={session.fileName}
                        secondary={session.preview || 'No messages'}
                        primaryTypographyProps={{ noWrap: true, variant: 'body2', fontWeight: 500 }}
                        secondaryTypographyProps={{ noWrap: true, variant: 'caption' }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          );
        })}
      </Box>

      <Divider />
      <List dense>
        <ListItemButton onClick={handleLogout}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </>
  );
}

export default function LeftDrawer({ open, onClose, embedded }) {
  // When embedded in the bento grid, render content directly (no Drawer wrapper)
  if (embedded) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <DrawerContent onClose={onClose} />
      </Box>
    );
  }

  // Traditional Drawer for mobile overlay
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        transition: 'width 0.2s',
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          position: 'relative',
          height: '100%',
        },
      }}
    >
      <DrawerContent onClose={onClose} />
    </Drawer>
  );
}
