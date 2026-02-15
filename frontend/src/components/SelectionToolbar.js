import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Paper, IconButton, Tooltip, TextField, Box, Button } from '@mui/material';
import HighlightIcon from '@mui/icons-material/Highlight';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import CommentIcon from '@mui/icons-material/Comment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { getSelectionBoundingRect } from '../utils/selectionUtils';
import { useChatContext } from '../contexts/ChatContext';

export default function SelectionToolbar({ containerRef, onHighlight, onComment, onOpenNotes }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [commentMode, setCommentMode] = useState(false);
  const [commentText, setCommentText] = useState('');
  const toolbarRef = useRef(null);
  const { sendMessage } = useChatContext();

  const updatePosition = useCallback(() => {
    const rect = getSelectionBoundingRect();
    if (!rect) {
      setVisible(false);
      return;
    }

    const toolbarHeight = 44;
    const margin = 8;

    let top = rect.top - toolbarHeight - margin;
    let left = rect.left + rect.width / 2;

    // If not enough room above, show below
    if (top < margin) {
      top = rect.bottom + margin;
    }

    // Clamp horizontal to viewport
    left = Math.max(100, Math.min(left, window.innerWidth - 100));

    setPosition({ top, left });
    setVisible(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    // Small delay so the selection is finalized
    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0) {
        updatePosition();
      } else if (!commentMode) {
        setVisible(false);
      }
    }, 10);
  }, [updatePosition, commentMode]);

  const dismiss = useCallback(() => {
    setVisible(false);
    setCommentMode(false);
    setCommentText('');
  }, []);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    container.addEventListener('mouseup', handleMouseUp);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', handleKeyDown);

    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target) && !commentMode) {
        // Check if selection still exists
        const sel = window.getSelection();
        if (!sel || sel.toString().trim().length === 0) {
          dismiss();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [containerRef, handleMouseUp, dismiss, commentMode]);

  const handleHighlight = () => {
    if (onHighlight) onHighlight();
    dismiss();
    window.getSelection()?.removeAllRanges();
  };

  const handleNote = () => {
    if (onOpenNotes) onOpenNotes();
    dismiss();
    window.getSelection()?.removeAllRanges();
  };

  const handleCommentToggle = () => {
    setCommentMode(true);
  };

  const handleCommentSubmit = () => {
    if (commentText.trim() && onComment) {
      onComment(commentText.trim());
    }
    dismiss();
    window.getSelection()?.removeAllRanges();
  };

  if (!visible) return null;

  return createPortal(
    <Paper
      ref={toolbarRef}
      elevation={8}
      sx={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
        zIndex: 1400,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.5,
        py: 0.25,
        borderRadius: '10px',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
      }}
    >
      {!commentMode ? (
        <>
          <Tooltip title="Highlight" arrow>
            <IconButton size="small" onClick={handleHighlight} sx={{ color: '#f59e0b' }}>
              <HighlightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Note" arrow>
            <IconButton size="small" onClick={handleNote} sx={{ color: '#3b82f6' }}>
              <StickyNote2Icon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Comment" arrow>
            <IconButton size="small" onClick={handleCommentToggle} sx={{ color: '#8b5cf6' }}>
              <CommentIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ask AI" arrow>
            <IconButton
              size="small"
              onClick={() => {
                const sel = window.getSelection();
                const text = sel ? sel.toString().trim() : '';
                if (text && sendMessage) {
                  sendMessage(`Explain this passage: "${text}"`);
                }
                dismiss();
                sel?.removeAllRanges();
              }}
              sx={{ color: '#06b6d4' }}
            >
              <AutoAwesomeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.5 }}>
          <TextField
            size="small"
            placeholder="Add comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCommentSubmit();
              }
            }}
            autoFocus
            sx={{ width: 200, '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.5 } }}
          />
          <Button size="small" variant="contained" onClick={handleCommentSubmit} disabled={!commentText.trim()}>
            Save
          </Button>
        </Box>
      )}
    </Paper>,
    document.body
  );
}
