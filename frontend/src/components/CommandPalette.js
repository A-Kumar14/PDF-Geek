import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Dialog,
  Box,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import SummarizeIcon from '@mui/icons-material/Summarize';
import QuizIcon from '@mui/icons-material/Quiz';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import PushPinIcon from '@mui/icons-material/PushPin';
import { useNavigate } from 'react-router-dom';
import { useThemeMode } from '../theme/ThemeContext';
import { usePersona } from '../contexts/PersonaContext';
import { useFile } from '../contexts/FileContext';
import { useChatContext } from '../contexts/ChatContext';
import { useHighlights } from '../contexts/HighlightsContext';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const navigate = useNavigate();
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();
  const { personas, selectPersona } = usePersona();
  const { file, removeFile } = useFile();
  const { sendMessage, clearMessages, clearAllSessions } = useChatContext();
  const { toggleNotesPanel } = useHighlights();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Global CMD+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Build command list
  const commands = useMemo(() => {
    const cmds = [
      {
        id: 'toggle-theme',
        label: mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        icon: mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />,
        category: 'Appearance',
        action: () => toggleMode(),
      },
      {
        id: 'settings',
        label: 'Open Settings',
        icon: <SettingsIcon fontSize="small" />,
        category: 'Navigation',
        action: () => navigate('/settings'),
      },
      {
        id: 'home',
        label: 'Go Home',
        icon: <HomeIcon fontSize="small" />,
        category: 'Navigation',
        action: () => { removeFile(); clearMessages(); },
      },
      {
        id: 'clear-sessions',
        label: 'Clear All Chat History',
        icon: <DeleteSweepIcon fontSize="small" />,
        category: 'Actions',
        action: () => clearAllSessions(),
      },
      {
        id: 'toggle-notes',
        label: 'Toggle Research Notes',
        icon: <PushPinIcon fontSize="small" />,
        category: 'Actions',
        action: () => toggleNotesPanel(),
      },
      {
        id: 'shortcuts',
        label: 'Show Keyboard Shortcuts',
        icon: <KeyboardIcon fontSize="small" />,
        category: 'Help',
        action: () => setShowShortcuts(true),
      },
    ];

    // File-specific commands
    if (file) {
      cmds.push(
        {
          id: 'summarize',
          label: 'Summarize Document',
          icon: <SummarizeIcon fontSize="small" />,
          category: 'AI Actions',
          action: () => sendMessage('Summarize'),
        },
        {
          id: 'quiz',
          label: 'Generate Quiz',
          icon: <QuizIcon fontSize="small" />,
          category: 'AI Actions',
          action: () => sendMessage('Make Quiz'),
        },
        {
          id: 'remove-file',
          label: 'Remove Current File',
          icon: <UploadFileIcon fontSize="small" />,
          category: 'Actions',
          action: () => { removeFile(); clearMessages(); },
        },
      );
    }

    // Persona switchers
    personas.forEach((p) => {
      cmds.push({
        id: `persona-${p.id}`,
        label: `Switch to ${p.label}`,
        icon: <PersonIcon fontSize="small" />,
        category: 'Personas',
        action: () => selectPersona(p.id),
      });
    });

    return cmds;
  }, [mode, file, personas, toggleMode, navigate, removeFile, clearMessages, clearAllSessions, sendMessage, selectPersona, toggleNotesPanel]);

  // Filter commands by query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Reset selection when query or open changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, open]);

  // Clear query on close
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const executeCommand = useCallback((cmd) => {
    setOpen(false);
    // Small delay so dialog closes first
    setTimeout(() => cmd.action(), 50);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      executeCommand(filtered[selectedIndex]);
    }
  }, [filtered, selectedIndex, executeCommand]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const isDark = mode === 'dark';

  return (
    <>
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          mt: '15vh',
          mx: 'auto',
          borderRadius: '16px',
          backdropFilter: 'blur(24px) saturate(180%)',
          backgroundColor: isDark
            ? alpha('#1A1A2E', 0.85)
            : alpha('#FFFFFF', 0.85),
          border: `1px solid ${isDark
            ? alpha('#E5E7EB', 0.08)
            : alpha('#94A3B8', 0.2)}`,
          boxShadow: isDark
            ? '0 24px 80px rgba(0,0,0,0.5)'
            : '0 24px 80px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: alpha('#000', isDark ? 0.5 : 0.25),
            backdropFilter: 'blur(4px)',
          },
        },
      }}
      TransitionProps={{ onEntered: () => inputRef.current?.focus() }}
    >
      {/* Search input */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <InputBase
          inputRef={inputRef}
          placeholder="Type a command..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
          sx={{
            fontSize: '0.95rem',
            fontWeight: 500,
            '& input::placeholder': { opacity: 0.5 },
          }}
        />
        <Chip
          label={navigator.platform?.includes('Mac') ? '\u2318K' : 'Ctrl+K'}
          size="small"
          variant="outlined"
          sx={{
            fontSize: '0.7rem',
            fontWeight: 600,
            height: 24,
            borderColor: theme.palette.divider,
            color: 'text.secondary',
          }}
        />
      </Box>

      {/* Command list */}
      <List
        ref={listRef}
        dense
        sx={{
          maxHeight: 360,
          overflow: 'auto',
          py: 1,
          px: 1,
        }}
        role="listbox"
      >
        {filtered.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <KeyboardIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No commands found
            </Typography>
          </Box>
        )}

        {filtered.map((cmd, idx) => {
          // Show category header when it changes
          const showCategory =
            idx === 0 || filtered[idx - 1].category !== cmd.category;

          return (
            <React.Fragment key={cmd.id}>
              {showCategory && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    px: 1.5,
                    pt: idx === 0 ? 0.5 : 1.5,
                    pb: 0.5,
                    display: 'block',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    fontSize: '0.65rem',
                  }}
                >
                  {cmd.category}
                </Typography>
              )}
              <ListItemButton
                role="option"
                aria-selected={idx === selectedIndex}
                selected={idx === selectedIndex}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(idx)}
                sx={{
                  borderRadius: '8px',
                  py: 0.75,
                  px: 1.5,
                  mb: 0.25,
                  transition: 'all 0.1s ease',
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, isDark ? 0.2 : 0.14),
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>
                  {cmd.icon}
                </ListItemIcon>
                <ListItemText
                  primary={cmd.label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                  }}
                />
              </ListItemButton>
            </React.Fragment>
          );
        })}
      </List>

      {/* Footer hints */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          px: 2.5,
          py: 1,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        {[
          { key: '\u2191\u2193', label: 'Navigate' },
          { key: '\u21B5', label: 'Select' },
          { key: 'Esc', label: 'Close' },
        ].map(({ key, label }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip
              label={key}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.65rem',
                fontWeight: 600,
                height: 20,
                minWidth: 24,
                borderColor: theme.palette.divider,
                color: 'text.secondary',
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            backdropFilter: 'blur(24px) saturate(180%)',
            backgroundColor: isDark ? alpha('#1A1A2E', 0.9) : alpha('#FFFFFF', 0.9),
          },
        }}
      >
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Keyboard Shortcuts
          </Typography>
          {[
            { keys: navigator.platform?.includes('Mac') ? '\u2318K' : 'Ctrl+K', desc: 'Command palette' },
            { keys: 'Enter', desc: 'Send message' },
            { keys: 'Shift+Enter', desc: 'New line in message' },
            { keys: 'Esc', desc: 'Close dialogs / panels' },
            { keys: '\u2190 \u2192', desc: 'Previous / next PDF page' },
            { keys: '+  \u2212', desc: 'Zoom in / out PDF' },
          ].map(({ keys, desc }) => (
            <Box key={desc} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
              <Typography variant="body2" color="text.secondary">{desc}</Typography>
              <Chip label={keys} size="small" variant="outlined" sx={{ fontSize: '0.72rem', fontWeight: 600, height: 24, borderColor: theme.palette.divider }} />
            </Box>
          ))}
        </Box>
      </Dialog>
    </>
  );
}
