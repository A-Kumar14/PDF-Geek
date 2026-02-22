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
  Tooltip,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ScienceIcon from '@mui/icons-material/Science';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PolicyIcon from '@mui/icons-material/Policy';
import CheckIcon from '@mui/icons-material/Check';
import PaletteIcon from '@mui/icons-material/Palette';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import { useNavigate } from 'react-router-dom';
import { useFile } from '../contexts/FileContext';
import { useChatContext } from '../contexts/ChatContext';
import { usePersona } from '../contexts/PersonaContext';
import { useModelContext } from '../contexts/ModelContext';
import { useThemeMode } from '../theme/ThemeContext';
import { THEME_NAMES } from '../theme/themes';

const PERSONA_ICONS = {
  academic: <SchoolIcon fontSize="small" />,
  professional: <WorkIcon fontSize="small" />,
  casual: <EmojiEmotionsIcon fontSize="small" />,
  einstein: <ScienceIcon fontSize="small" />,
  genz_tutor: <AutoAwesomeIcon fontSize="small" />,
  sherlock: <PolicyIcon fontSize="small" />,
};

export default function TopBar({ onOpenSettings }) {
  const navigate = useNavigate();
  const { file, removeFile } = useFile();
  const { clearMessages } = useChatContext();
  const { personaId, selectPersona, personas, persona } = usePersona();
  const { selectedModel, setSelectedModel } = useModelContext();
  const { themeName, setTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState(null);
  const [modelAnchorEl, setModelAnchorEl] = useState(null);
  const [themeAnchorEl, setThemeAnchorEl] = useState(null);
  const [socraticMode, setSocraticMode] = useState(false);
  const [podcastMode, setPodcastMode] = useState(false);

  const MODELS = [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: 'FREE' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', badge: 'FREE' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', badge: 'PRO' },
    { id: 'gpt-4o', name: 'GPT-4o', badge: 'PRO' },
  ];

  const handleNew = () => {
    removeFile();
    clearMessages();
  };

  const handleToggleSocratic = () => {
    const nextState = !socraticMode;
    setSocraticMode(nextState);
    if (nextState) {
      selectPersona('socratic');
    } else {
      selectPersona('academic'); // Default fallback
    }
  };

  const { activeSessionId, addMessage, startNewSession } = useChatContext();
  const [generatingPodcast, setGeneratingPodcast] = useState(false);

  const handleGeneratePodcast = async () => {
    if (generatingPodcast) return;
    setGeneratingPodcast(true);
    setPodcastMode(true);
    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        sessionId = await startNewSession(file?.name || 'Document', 'pdf');
      }
      addMessage('user', 'Generate a podcast script summarizing this document.');

      const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('filegeek-token');

      const res = await fetch(`${API}/podcast/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          topic: file?.name || 'the document',
          model: selectedModel
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate podcast');

      addMessage('assistant', data.script);
    } catch (err) {
      addMessage('system', `Error generating podcast: ${err.message}`);
    } finally {
      setGeneratingPodcast(false);
      setTimeout(() => setPodcastMode(false), 2000);
    }
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

        {/* Model Selector */}
        <Box
          onClick={(e) => setModelAnchorEl(e.currentTarget)}
          sx={{
            border: '1px solid #333333',
            px: 1,
            py: 0.25,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            minWidth: 140,
            '&:hover': { borderColor: '#E5E5E5' },
          }}
        >
          <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#888888' }}>
            MODEL:
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#00FF00', fontWeight: 700 }}>
            {selectedModel.split('-')[0].toUpperCase()}
          </Typography>
        </Box>

        {/* Model dropdown */}
        <Menu
          anchorEl={modelAnchorEl}
          open={Boolean(modelAnchorEl)}
          onClose={() => setModelAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" sx={{ color: '#888', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
              SELECT_MODEL
            </Typography>
          </Box>
          {MODELS.map((model) => (
            <MenuItem
              key={model.id}
              onClick={() => { setSelectedModel(model.id); setModelAnchorEl(null); }}
              selected={model.id === selectedModel}
              sx={{
                py: 0.75,
                display: 'flex',
                justifyContent: 'space-between',
                '&.Mui-selected': {
                  bgcolor: 'rgba(0, 255, 0, 0.1)',
                  borderLeft: '2px solid #00FF00',
                },
              }}
            >
              <ListItemText
                primary={model.name}
                primaryTypographyProps={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: model.id === selectedModel ? 700 : 400 }}
              />
              <Box
                sx={{
                  ml: 2,
                  px: 0.75,
                  py: 0.25,
                  bgcolor: model.badge === 'FREE' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 255, 0.1)',
                  border: `1px solid ${model.badge === 'FREE' ? '#00FF00' : '#FF00FF'}`,
                  fontFamily: 'monospace',
                  fontSize: '0.6rem',
                  color: model.badge === 'FREE' ? '#00FF00' : '#FF00FF',
                }}
              >
                {model.badge}
              </Box>
            </MenuItem>
          ))}
        </Menu>

        {/* Theme quick-swap */}
        <Tooltip title="Theme">
          <IconButton
            size="small"
            onClick={(e) => setThemeAnchorEl(e.currentTarget)}
            aria-label="Change theme"
            sx={{
              color: '#888',
              '&:hover': { bgcolor: '#333333' },
            }}
          >
            <PaletteIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={themeAnchorEl}
          open={Boolean(themeAnchorEl)}
          onClose={() => setThemeAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" sx={{ color: '#888', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
              THEME_PRESET
            </Typography>
          </Box>
          {THEME_NAMES.map((t) => (
            <MenuItem
              key={t}
              onClick={() => { setTheme(t); setThemeAnchorEl(null); }}
              selected={t === themeName}
              sx={{
                py: 0.75,
                '&.Mui-selected': {
                  bgcolor: 'rgba(0, 255, 0, 0.1)',
                  borderLeft: '2px solid #00FF00',
                },
              }}
            >
              <ListItemText
                primary={t.toUpperCase()}
                primaryTypographyProps={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: t === themeName ? 700 : 400 }}
              />
              {t === themeName && (
                <CheckIcon sx={{ fontSize: 14, color: '#00FF00', ml: 1 }} />
              )}
            </MenuItem>
          ))}
        </Menu>

        {/* Socratic Tutor Mode toggle */}
        <Tooltip title="Active Recall (Socratic Tutor)">
          <IconButton
            size="small"
            onClick={handleToggleSocratic}
            sx={{
              color: socraticMode ? 'var(--accent)' : '#888',
              bgcolor: socraticMode ? 'var(--accent-dim)' : 'transparent',
              border: `1px solid ${socraticMode ? 'var(--accent)' : 'transparent'}`,
              borderRadius: '4px',
              p: 0.5,
              '&:hover': { bgcolor: socraticMode ? 'var(--bg-hover)' : '#333333' },
            }}
          >
            <PsychologyAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Podcast Mode toggle */}
        <Tooltip title={generatingPodcast ? "Generating..." : "Generate Podcast Summary"}>
          <IconButton
            size="small"
            onClick={handleGeneratePodcast}
            disabled={generatingPodcast}
            sx={{
              color: podcastMode ? '#FF00FF' : '#888',
              bgcolor: podcastMode ? 'rgba(255, 0, 255, 0.1)' : 'transparent',
              border: `1px solid ${podcastMode ? '#FF00FF' : 'transparent'}`,
              borderRadius: '4px',
              p: 0.5,
              opacity: generatingPodcast ? 0.5 : 1,
              '&:hover': { bgcolor: podcastMode ? 'rgba(255, 0, 255, 0.2)' : '#333333' },
            }}
          >
            <HeadphonesIcon fontSize="small" />
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
