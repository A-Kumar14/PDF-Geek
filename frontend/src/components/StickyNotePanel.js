import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Box, Typography, TextField, Tooltip } from '@mui/material';
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
    <Box
      sx={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: 320,
        maxHeight: 400,
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #333333',
        bgcolor: '#0D0D0D',
      }}
    >
      {/* Header */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 0.75,
          borderBottom: '1px solid #333333',
          bgcolor: '#000000',
          cursor: 'grab',
          userSelect: 'none',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', color: '#E5E5E5' }} noWrap>
          NOTES — {file?.name || 'UNTITLED'}
        </Typography>
        <Tooltip title="Close">
          <Box
            onClick={() => setNotePanelOpen(false)}
            sx={{ cursor: 'pointer', color: '#888', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, '&:hover': { color: '#E5E5E5' } }}
          >
            [x]
          </Box>
        </Tooltip>
      </Box>

      {/* Notes list */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {notes.length === 0 && (
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888', textAlign: 'center', py: 3 }}>
            [NO_NOTES]
          </Typography>
        )}
        {notes.map((note) => (
          <Box key={note.id} sx={{ border: '1px solid #333333', p: 1 }}>
            <TextField
              multiline
              minRows={2}
              maxRows={5}
              fullWidth
              size="small"
              defaultValue={note.content}
              placeholder="TYPE_NOTE..."
              onBlur={(e) => updateNote(note.id, e.target.value)}
              sx={{
                '& .MuiInputBase-root': { fontSize: '0.8rem', fontFamily: 'monospace', bgcolor: '#000' },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
              <Typography sx={{ fontSize: '0.6rem', fontFamily: 'monospace', color: '#555' }}>
                {new Date(note.createdAt).toLocaleString()}
              </Typography>
              <Tooltip title="Delete">
                <Box
                  onClick={() => removeNote(note.id)}
                  sx={{ cursor: 'pointer', color: '#888', fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700, '&:hover': { color: '#FF0000' } }}
                >
                  [DEL]
                </Box>
              </Tooltip>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Add Note */}
      <Box sx={{ p: 1, borderTop: '1px solid #333333' }}>
        <Box
          onClick={handleAddNote}
          sx={{
            cursor: 'pointer',
            textAlign: 'center',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#888',
            py: 0.5,
            border: '1px solid #333',
            '&:hover': { borderColor: '#00FF00', color: '#00FF00' },
          }}
        >
          [ + ADD NOTE ]
        </Box>
      </Box>
    </Box>,
    document.body
  );
}
