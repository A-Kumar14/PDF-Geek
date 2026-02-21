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
import {
  Search,
  Settings,
  Home,
  User,
  FileText,
  FileQuestion,
  Trash2,
  Upload,
  Keyboard,
  Pin,
  LogOut,
  Folder,
  Image,
  File,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePersona } from '../contexts/PersonaContext';
import { useFile } from '../contexts/FileContext';
import { useChatContext } from '../contexts/ChatContext';
import { useHighlights } from '../contexts/HighlightsContext';
import { useAuth } from '../contexts/AuthContext';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const { logout } = useAuth();
  const { personas, selectPersona } = usePersona();
  const { file, files, activeFileIndex, setActiveFileIndex, removeFile, handleFileSelect } = useFile();
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleUploadTrigger = () => {
    setOpen(false);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  // Get file type icon
  const getFileIcon = (fileName) => {
    const ext = (fileName || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4" />;
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return <Image className="w-4 h-4" />;
    if (['docx', 'txt'].includes(ext)) return <File className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const commands = useMemo(() => {
    const cmds = [
      // Upload action - Always first
      {
        id: 'upload',
        label: 'UPLOAD_NEW_FILE',
        icon: <Upload className="w-4 h-4" />,
        category: 'FILE_ACTIONS',
        action: handleUploadTrigger,
        priority: 1000,
      },

      // Navigation
      {
        id: 'settings',
        label: 'OPEN_SETTINGS',
        icon: <Settings className="w-4 h-4" />,
        category: 'NAVIGATION',
        action: () => navigate('/settings'),
        priority: 90,
      },
      {
        id: 'home',
        label: 'GO_HOME',
        icon: <Home className="w-4 h-4" />,
        category: 'NAVIGATION',
        action: () => { removeFile(); clearMessages(); },
        priority: 95,
      },

      // Actions
      {
        id: 'clear-sessions',
        label: 'CLEAR_ALL_HISTORY',
        icon: <Trash2 className="w-4 h-4" />,
        category: 'ACTIONS',
        action: () => clearAllSessions(),
        priority: 80,
      },
      {
        id: 'toggle-notes',
        label: 'TOGGLE_RESEARCH_NOTES',
        icon: <Pin className="w-4 h-4" />,
        category: 'ACTIONS',
        action: () => toggleNotesPanel(),
        priority: 85,
      },
      {
        id: 'logout',
        label: 'LOGOUT',
        icon: <LogOut className="w-4 h-4" />,
        category: 'ACTIONS',
        action: handleLogout,
        priority: 70,
      },

      // Help
      {
        id: 'shortcuts',
        label: 'KEYBOARD_SHORTCUTS',
        icon: <Keyboard className="w-4 h-4" />,
        category: 'HELP',
        action: () => setShowShortcuts(true),
        priority: 60,
      },
    ];

    // Add current file actions if file exists
    if (file) {
      cmds.push(
        {
          id: 'summarize',
          label: 'SUMMARIZE_DOCUMENT',
          icon: <FileText className="w-4 h-4" />,
          category: 'AI_ACTIONS',
          action: () => sendMessage('Summarize this document'),
          priority: 100,
        },
        {
          id: 'quiz',
          label: 'GENERATE_QUIZ',
          icon: <FileQuestion className="w-4 h-4" />,
          category: 'AI_ACTIONS',
          action: () => sendMessage('Generate a quiz from this document'),
          priority: 98,
        },
        {
          id: 'remove-file',
          label: 'REMOVE_CURRENT_FILE',
          icon: <Trash2 className="w-4 h-4" />,
          category: 'FILE_ACTIONS',
          action: () => { removeFile(); clearMessages(); },
          priority: 88,
        },
      );
    }

    // Add all files to the command palette
    if (files && files.length > 0) {
      files.forEach((f, idx) => {
        const fileName = f.fileName || f.name || 'Untitled';
        const isActive = idx === activeFileIndex;

        cmds.push({
          id: `file-${idx}`,
          label: fileName,
          icon: getFileIcon(fileName),
          category: 'YOUR_FILES',
          action: () => setActiveFileIndex(idx),
          priority: isActive ? 500 : 400, // Active file has higher priority
          isFile: true,
          isActive,
        });
      });
    }

    // Add personas
    personas.forEach((p) => {
      cmds.push({
        id: `persona-${p.id}`,
        label: `SWITCH_TO_${p.label.toUpperCase().replace(/\s+/g, '_')}`,
        icon: <User className="w-4 h-4" />,
        category: 'PERSONAS',
        action: () => selectPersona(p.id),
        priority: 50,
      });
    });

    return cmds;
  }, [file, files, activeFileIndex, personas, navigate, removeFile, clearMessages, clearAllSessions, sendMessage, selectPersona, toggleNotesPanel, setActiveFileIndex]);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Sort by priority when no search query
      return [...commands].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    const q = query.toLowerCase();
    return commands
      .filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(q) ||
          cmd.category.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.label.toLowerCase() === q;
        const bExact = b.label.toLowerCase() === q;
        if (aExact !== bExact) return aExact ? -1 : 1;

        // Then by priority
        return (b.priority || 0) - (a.priority || 0);
      });
  }, [commands, query]);

  useEffect(() => { setSelectedIndex(0); }, [query, open]);
  useEffect(() => { if (!open) setQuery(''); }, [open]);

  const executeCommand = useCallback((cmd) => {
    setOpen(false);
    setQuery('');
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
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files[0])}
      />

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
            borderRadius: 0,
          },
        }}
        slotProps={{
          backdrop: {
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.85)' },
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
            py: 1.5,
            borderBottom: '1px solid #333333',
          }}
        >
          <Search className="w-4 h-4 text-mono-dim" />
          <InputBase
            inputRef={inputRef}
            placeholder="TYPE_COMMAND_OR_SEARCH_FILES..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            sx={{
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              fontWeight: 500,
              color: '#E5E5E5',
              '& input::placeholder': { color: '#666', opacity: 1 },
            }}
          />
          <Typography sx={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#888', border: '1px solid #333', px: 0.75, py: 0.25 }}>
            {navigator.platform?.includes('Mac') ? '⌘K' : 'Ctrl+K'}
          </Typography>
        </Box>

        {/* Command list */}
        <List
          ref={listRef}
          dense
          sx={{ maxHeight: 420, overflow: 'auto', py: 0.5, px: 0.5 }}
          role="listbox"
          className="custom-scrollbar"
        >
          {filtered.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ color: '#888', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                [NO_RESULTS_FOUND]
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
                    bgcolor: cmd.isActive ? 'rgba(0, 255, 0, 0.05)' : 'transparent',
                    '&.Mui-selected': {
                      bgcolor: cmd.isActive ? 'rgba(0, 255, 0, 0.1)' : '#1A1A1A',
                      '&:hover': { bgcolor: '#222' },
                    },
                    '&:hover': { bgcolor: cmd.isActive ? 'rgba(0, 255, 0, 0.08)' : '#1A1A1A' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: idx === selectedIndex ? '#00FF00' : cmd.isActive ? '#00FF00' : '#888' }}>
                    {cmd.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={cmd.label}
                    primaryTypographyProps={{
                      fontFamily: 'monospace',
                      fontWeight: cmd.isActive ? 700 : 500,
                      fontSize: '0.8rem',
                      color: idx === selectedIndex ? '#E5E5E5' : cmd.isActive ? '#00FF00' : '#AAA',
                      noWrap: true,
                    }}
                  />
                  {cmd.isActive && (
                    <Typography sx={{ fontSize: '0.6rem', fontFamily: 'monospace', color: '#00FF00', ml: 1 }}>
                      [ACTIVE]
                    </Typography>
                  )}
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
            { key: '↑↓', label: 'NAV' },
            { key: '↵', label: 'SELECT' },
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
          sx: { bgcolor: '#0D0D0D', border: '1px solid #333333', borderRadius: 0 },
        }}
      >
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, mb: 2, color: '#E5E5E5', fontSize: '0.9rem' }}>
            KEYBOARD_SHORTCUTS
          </Typography>
          {[
            { keys: navigator.platform?.includes('Mac') ? '⌘K' : 'Ctrl+K', desc: 'Command palette' },
            { keys: 'Enter', desc: 'Send message' },
            { keys: 'Shift+Enter', desc: 'New line' },
            { keys: 'Esc', desc: 'Close dialogs' },
            { keys: '← →', desc: 'Prev / next page' },
            { keys: '+  −', desc: 'Zoom in / out' },
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
