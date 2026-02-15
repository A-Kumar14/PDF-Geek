import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  alpha,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ScienceIcon from '@mui/icons-material/Science';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PolicyIcon from '@mui/icons-material/Policy';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';
import { useThemeMode } from '../theme/ThemeContext';
import { useFile } from '../contexts/FileContext';
import { useChatContext } from '../contexts/ChatContext';
import { usePersona } from '../contexts/PersonaContext';
import DeepThinkToggle from './DeepThinkToggle';

const PERSONA_ICONS = {
  academic: <SchoolIcon fontSize="small" />,
  professional: <WorkIcon fontSize="small" />,
  casual: <EmojiEmotionsIcon fontSize="small" />,
  einstein: <ScienceIcon fontSize="small" />,
  genz_tutor: <AutoAwesomeIcon fontSize="small" />,
  sherlock: <PolicyIcon fontSize="small" />,
};

export default function TopBar({ onToggleDrawer }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();
  const { file, removeFile } = useFile();
  const { clearMessages } = useChatContext();
  const { personaId, selectPersona, personas, persona } = usePersona();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleNew = () => {
    removeFile();
    clearMessages();
  };

  const isDark = mode === 'dark';

  return (
    <AppBar position="sticky" color="transparent" enableColorOnDark>
      <Toolbar
        variant="dense"
        sx={{
          gap: 0.5,
          minHeight: 48,
          px: { xs: 1, md: 2 },
        }}
      >
        <IconButton edge="start" onClick={onToggleDrawer} size="small">
          <MenuIcon />
        </IconButton>

        {/* Logo */}
        <Box
          onClick={handleNew}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            mr: 1,
            '&:hover': { opacity: 0.8 },
            transition: 'opacity 0.15s',
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: 'primary.main', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}
          >
            File
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}
          >
            Geek
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* CMD+K hint */}
        <Chip
          icon={<SearchIcon sx={{ fontSize: 14 }} />}
          label={navigator.platform?.includes('Mac') ? '\u2318K' : 'Ctrl+K'}
          size="small"
          variant="outlined"
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          sx={{
            height: 28,
            fontSize: '0.72rem',
            fontWeight: 600,
            borderColor: theme.palette.divider,
            color: 'text.secondary',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.main',
            },
            transition: 'all 0.15s',
            display: { xs: 'none', sm: 'flex' },
          }}
        />

        {/* Persona Identity Hub */}
        <Chip
          avatar={
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: 'primary.main',
                width: 24,
                height: 24,
              }}
            >
              {PERSONA_ICONS[personaId] || <SchoolIcon sx={{ fontSize: 14 }} />}
            </Avatar>
          }
          label={persona.label}
          deleteIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
          onDelete={() => {}} // needed to show delete icon
          onClick={(e) => setAnchorEl(e.currentTarget)}
          size="small"
          sx={{
            height: 32,
            fontSize: '0.8rem',
            fontWeight: 600,
            borderRadius: '10px',
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.1 : 0.06),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            color: 'text.primary',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.1),
            },
            transition: 'all 0.15s',
            '& .MuiChip-deleteIcon': {
              color: 'text.secondary',
              ml: -0.5,
            },
          }}
        />

        {/* Persona dropdown menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                mt: 0.5,
                minWidth: 220,
                borderRadius: '12px',
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
              Switch Persona
            </Typography>
          </Box>
          {personas.map((p) => (
            <MenuItem
              key={p.id}
              onClick={() => { selectPersona(p.id); setAnchorEl(null); }}
              selected={p.id === personaId}
              sx={{
                borderRadius: '8px',
                mx: 0.5,
                mb: 0.25,
                py: 1,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, isDark ? 0.12 : 0.08),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: p.id === personaId ? 'primary.main' : 'text.secondary' }}>
                {PERSONA_ICONS[p.id] || <SchoolIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText
                primary={p.label}
                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: p.id === personaId ? 600 : 400 }}
              />
              {p.id === personaId && (
                <CheckIcon sx={{ fontSize: 16, color: 'primary.main', ml: 1 }} />
              )}
            </MenuItem>
          ))}
        </Menu>

        <DeepThinkToggle />

        {file && (
          <Button
            size="small"
            variant="outlined"
            onClick={handleNew}
            sx={{
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              px: 1.5,
              borderColor: theme.palette.divider,
              '&:hover': {
                borderColor: 'primary.main',
              },
            }}
          >
            New
          </Button>
        )}

        <IconButton onClick={toggleMode} size="small">
          {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>

        <IconButton onClick={() => navigate('/settings')} size="small">
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
