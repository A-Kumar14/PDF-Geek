import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useAnnotations } from '../contexts/AnnotationContext';
import { useFile } from '../contexts/FileContext';

export default function StickyNotePanel() {
  const { notes, addNote, updateNote, removeNote, notePanelOpen, setNotePanelOpen } = useAnnotations();
  const { file } = useFile();
  const [pos, setPos] = useState({ x: window.innerWidth - 360, y: 100 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging.current) return;
      setPos({
        x: Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - 320)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 100)),
      });
    };
    const handleMouseUp = () => {
      dragging.current = false;
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleAddNote = () => {
    addNote('');
  };

  if (!notePanelOpen) return null;

  return createPortal(
    <Paper
      elevation={12}
      sx={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: 320,
        maxHeight: 400,
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
      }}
    >
      {/* Header */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          bgcolor: '#FFF9C4',
          cursor: 'grab',
          userSelect: 'none',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragIndicatorIcon sx={{ fontSize: 18, color: '#9e9e9e' }} />
        <Typography variant="body2" fontWeight={700} sx={{ flex: 1, color: '#5d4037' }} noWrap>
          Notes — {file?.name || 'Untitled'}
        </Typography>
        <IconButton size="small" onClick={() => setNotePanelOpen(false)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Notes list */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {notes.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
            No notes yet. Click "+ Add Note" to start.
          </Typography>
        )}
        {notes.map((note) => (
          <Box key={note.id} sx={{ position: 'relative' }}>
            <TextField
              multiline
              minRows={2}
              maxRows={5}
              fullWidth
              size="small"
              defaultValue={note.content}
              placeholder="Type your note..."
              onBlur={(e) => updateNote(note.id, e.target.value)}
              sx={{
                '& .MuiInputBase-root': { fontSize: '0.82rem', bgcolor: 'background.paper' },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {new Date(note.createdAt).toLocaleString()}
              </Typography>
              <Tooltip title="Delete note" arrow>
                <IconButton size="small" onClick={() => removeNote(note.id)} sx={{ color: 'error.main' }}>
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Add Note button */}
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddNote}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Add Note
        </Button>
      </Box>
    </Paper>,
    document.body
  );
}
