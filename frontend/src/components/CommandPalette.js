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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
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
  const { personas, selectPersona } = usePersona();
  const { file, removeFile } = useFile();
  const { sendMessage, clearMessages, clearAllSessions } = useChatContext();
  const { toggleNotesPanel } = useHighlights();
  const [showShortcuts, setShowShortcuts] = useState(false);

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

  const commands = useMemo(() => {
    const cmds = [
      {
        id: 'settings',
        label: 'OPEN_SETTINGS',
        icon: <SettingsIcon fontSize="small" />,
        category: 'NAVIGATION',
        action: () => navigate('/settings'),
      },
      {
        id: 'home',
        label: 'GO_HOME',
        icon: <HomeIcon fontSize="small" />,
        category: 'NAVIGATION',
        action: () => { removeFile(); clearMessages(); },
      },
      {
        id: 'clear-sessions',
        label: 'CLEAR_ALL_HISTORY',
        icon: <DeleteSweepIcon fontSize="small" />,
        category: 'ACTIONS',
        action: () => clearAllSessions(),
      },
      {
        id: 'toggle-notes',
        label: 'TOGGLE_RESEARCH_NOTES',
        icon: <PushPinIcon fontSize="small" />,
        category: 'ACTIONS',
        action: () => toggleNotesPanel(),
      },
      {
        id: 'shortcuts',
        label: 'KEYBOARD_SHORTCUTS',
        icon: <KeyboardIcon fontSize="small" />,
        category: 'HELP',
        action: () => setShowShortcuts(true),
      },
    ];

    if (file) {
      cmds.push(
        {
          id: 'summarize',
          label: 'SUMMARIZE_DOCUMENT',
          icon: <SummarizeIcon fontSize="small" />,
          category: 'AI_ACTIONS',
          action: () => sendMessage('Summarize'),
        },
        {
          id: 'quiz',
          label: 'GENERATE_QUIZ',
          icon: <QuizIcon fontSize="small" />,
          category: 'AI_ACTIONS',
          action: () => sendMessage('Make Quiz'),
        },
        {
          id: 'remove-file',
          label: 'REMOVE_CURRENT_FILE',
          icon: <UploadFileIcon fontSize="small" />,
          category: 'ACTIONS',
          action: () => { removeFile(); clearMessages(); },
        },
      );
    }

    personas.forEach((p) => {
      cmds.push({
        id: `persona-${p.id}`,
        label: `SWITCH_TO_${p.label.toUpperCase().replace(/\s+/g, '_')}`,
        icon: <PersonIcon fontSize="small" />,
        category: 'PERSONAS',
        action: () => selectPersona(p.id),
      });
    });

    return cmds;
  }, [file, personas, navigate, removeFile, clearMessages, clearAllSessions, sendMessage, selectPersona, toggleNotesPanel]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => { setSelectedIndex(0); }, [query, open]);
  useEffect(() => { if (!open) setQuery(''); }, [open]);

  const executeCommand = useCallback((cmd) => {
    setOpen(false);
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

  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

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
            bgcolor: '#0D0D0D',
            border: '1px solid #333333',
            overflow: 'hidden',
          },
        }}
        slotProps={{
          backdrop: {
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
          },
        }}
        TransitionProps={{ onEntered: () => inputRef.current?.focus() }}
      >
        {/* Search input */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderBottom: '1px solid #333333',
          }}
        >
          <SearchIcon sx={{ color: '#888', fontSize: 18 }} />
          <InputBase
            inputRef={inputRef}
            placeholder="TYPE_COMMAND..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            sx={{
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              fontWeight: 500,
              color: '#E5E5E5',
              '& input::placeholder': { color: '#666', opacity: 1 },
            }}
          />
          <Typography sx={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#888', border: '1px solid #333', px: 0.75, py: 0.25 }}>
            {navigator.platform?.includes('Mac') ? '\u2318K' : 'Ctrl+K'}
          </Typography>
        </Box>

        {/* Command list */}
        <List
          ref={listRef}
          dense
          sx={{ maxHeight: 360, overflow: 'auto', py: 0.5, px: 0.5 }}
          role="listbox"
        >
          {filtered.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ color: '#888', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                [NO_COMMANDS_FOUND]
              </Typography>
            </Box>
          )}

          {filtered.map((cmd, idx) => {
            const showCategory = idx === 0 || filtered[idx - 1].category !== cmd.category;
            return (
              <React.Fragment key={cmd.id}>
                {showCategory && (
                  <Typography
                    sx={{
                      px: 1.5,
                      pt: idx === 0 ? 0.5 : 1.5,
                      pb: 0.5,
                      display: 'block',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      fontSize: '0.6rem',
                      color: '#888',
                    }}
                  >
                    {`// ${cmd.category}`}
                  </Typography>
                )}
                <ListItemButton
                  role="option"
                  aria-selected={idx === selectedIndex}
                  selected={idx === selectedIndex}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  sx={{
                    py: 0.75,
                    px: 1.5,
                    mb: 0.25,
                    borderLeft: idx === selectedIndex ? '2px solid #00FF00' : '2px solid transparent',
                    '&.Mui-selected': {
                      bgcolor: '#1A1A1A',
                      '&:hover': { bgcolor: '#222' },
                    },
                    '&:hover': { bgcolor: '#1A1A1A' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 28, color: idx === selectedIndex ? '#00FF00' : '#888' }}>
                    {cmd.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={cmd.label}
                    primaryTypographyProps={{
                      fontFamily: 'monospace',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      color: idx === selectedIndex ? '#E5E5E5' : '#AAA',
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
            px: 2,
            py: 0.75,
            borderTop: '1px solid #333333',
          }}
        >
          {[
            { key: '\u2191\u2193', label: 'NAV' },
            { key: '\u21B5', label: 'SELECT' },
            { key: 'ESC', label: 'CLOSE' },
          ].map(({ key, label }) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: '0.6rem', fontFamily: 'monospace', color: '#888', border: '1px solid #333', px: 0.5 }}>
                {key}
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', fontFamily: 'monospace', color: '#666' }}>
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
          sx: { bgcolor: '#0D0D0D', border: '1px solid #333333' },
        }}
      >
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, mb: 2, color: '#E5E5E5', fontSize: '0.9rem' }}>
            KEYBOARD_SHORTCUTS
          </Typography>
          {[
            { keys: navigator.platform?.includes('Mac') ? '\u2318K' : 'Ctrl+K', desc: 'Command palette' },
            { keys: 'Enter', desc: 'Send message' },
            { keys: 'Shift+Enter', desc: 'New line' },
            { keys: 'Esc', desc: 'Close dialogs' },
            { keys: '\u2190 \u2192', desc: 'Prev / next page' },
            { keys: '+  \u2212', desc: 'Zoom in / out' },
          ].map(({ keys, desc }) => (
            <Box key={desc} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, borderBottom: '1px solid #222' }}>
              <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#888' }}>{desc}</Typography>
              <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#E5E5E5', border: '1px solid #333', px: 0.75, py: 0.25 }}>
                {keys}
              </Typography>
            </Box>
          ))}
        </Box>
      </Dialog>
    </>
  );
}
