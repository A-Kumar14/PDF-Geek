import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ScienceIcon from '@mui/icons-material/Science';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PolicyIcon from '@mui/icons-material/Policy';
import CheckIcon from '@mui/icons-material/Check';
import PushPinIcon from '@mui/icons-material/PushPin';
import { useNavigate } from 'react-router-dom';
import { useFile } from '../contexts/FileContext';
import { useChatContext } from '../contexts/ChatContext';
import { usePersona } from '../contexts/PersonaContext';
import { useHighlights } from '../contexts/HighlightsContext';
import DeepThinkToggle from './DeepThinkToggle';

const PERSONA_ICONS = {
  academic: <SchoolIcon fontSize="small" />,
  professional: <WorkIcon fontSize="small" />,
  casual: <EmojiEmotionsIcon fontSize="small" />,
  einstein: <ScienceIcon fontSize="small" />,
  genz_tutor: <AutoAwesomeIcon fontSize="small" />,
  sherlock: <PolicyIcon fontSize="small" />,
};

export default function TopBar({ onToggleDrawer, drawerOpen, onOpenSettings }) {
  const navigate = useNavigate();
  const { file, removeFile } = useFile();
  const { clearMessages } = useChatContext();
  const { personaId, selectPersona, personas, persona } = usePersona();
  const { pinnedNotes, notesPanelOpen, toggleNotesPanel } = useHighlights();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleNew = () => {
    removeFile();
    clearMessages();
  };

  return (
    <AppBar position="sticky" color="transparent" enableColorOnDark>
      <Toolbar
        variant="dense"
        sx={{
          gap: 0.5,
          minHeight: 44,
          px: { xs: 1, md: 2 },
          bgcolor: '#000000',
        }}
      >
        <IconButton edge="start" onClick={onToggleDrawer} size="small" aria-label="Toggle sidebar" sx={{ color: '#888' }}>
          {drawerOpen ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>

        {/* Logo */}
        <Box
          onClick={handleNew}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mr: 1 }}
        >
          <Typography
            variant="h6"
            sx={{ color: '#00FF00', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'monospace', letterSpacing: '0.1em' }}
          >
            FileGeek
          </Typography>
        </Box>

        {/* Active filename */}
        {file && (
          <Typography
            variant="body2"
            noWrap
            sx={{
              maxWidth: { xs: 100, sm: 200, md: 280 },
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              color: '#888888',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {'> '}{file.name}
          </Typography>
        )}

        <Box sx={{ flex: 1 }} />

        {/* CMD+K hint */}
        <Tooltip title="Command palette">
          <Box
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            sx={{
              border: '1px solid #333333',
              px: 1,
              py: 0.25,
              cursor: 'pointer',
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 0.5,
              '&:hover': { borderColor: '#E5E5E5' },
            }}
          >
            <SearchIcon sx={{ fontSize: 14, color: '#888' }} />
            <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#888' }}>
              {navigator.platform?.includes('Mac') ? '\u2318K' : 'Ctrl+K'}
            </Typography>
          </Box>
        </Tooltip>

        {/* Persona switcher */}
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            border: '1px solid #333333',
            px: 1.5,
            py: 0.25,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            '&:hover': { borderColor: '#E5E5E5' },
          }}
        >
          <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#E5E5E5', fontWeight: 700 }}>
            [ {persona.label?.toUpperCase()} ]
          </Typography>
        </Box>

        {/* Persona dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" sx={{ color: '#888', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
              SWITCH_PERSONA
            </Typography>
          </Box>
          {personas.map((p) => (
            <MenuItem
              key={p.id}
              onClick={() => { selectPersona(p.id); setAnchorEl(null); }}
              selected={p.id === personaId}
              sx={{
                py: 0.75,
                '&.Mui-selected': {
                  bgcolor: 'rgba(0, 255, 0, 0.1)',
                  borderLeft: '2px solid #00FF00',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 28, color: p.id === personaId ? '#00FF00' : '#888' }}>
                {PERSONA_ICONS[p.id] || <SchoolIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText
                primary={p.label}
                primaryTypographyProps={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: p.id === personaId ? 700 : 400 }}
              />
              {p.id === personaId && (
                <CheckIcon sx={{ fontSize: 14, color: '#00FF00', ml: 1 }} />
              )}
            </MenuItem>
          ))}
        </Menu>

        <DeepThinkToggle />

        {/* Research notes toggle */}
        <Tooltip title={notesPanelOpen ? 'Close notes' : 'Research notes'}>
          <IconButton
            size="small"
            onClick={toggleNotesPanel}
            aria-label="Toggle research notes"
            sx={{
              color: notesPanelOpen ? '#00FF00' : '#888',
              bgcolor: notesPanelOpen ? 'rgba(0, 255, 0, 0.1)' : 'transparent',
              '&:hover': { bgcolor: '#333333' },
            }}
          >
            <Badge
              badgeContent={pinnedNotes.length}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.6rem',
                  height: 14,
                  minWidth: 14,
                  bgcolor: '#00FF00',
                  color: '#000',
                  display: pinnedNotes.length === 0 ? 'none' : 'flex',
                },
              }}
            >
              <PushPinIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* New file button */}
        {file && (
          <Box
            onClick={handleNew}
            sx={{
              border: '1px solid #333333',
              px: 1.5,
              py: 0.25,
              cursor: 'pointer',
              '&:hover': { borderColor: '#E5E5E5', bgcolor: '#333333' },
            }}
          >
            <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#E5E5E5', fontWeight: 700 }}>
              [ NEW ]
            </Typography>
          </Box>
        )}

        <IconButton onClick={onOpenSettings || (() => navigate('/settings'))} size="small" aria-label="Settings" sx={{ color: '#888' }}>
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
