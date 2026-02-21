import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Box, TextField, Tooltip } from '@mui/material';
import { getSelectionBoundingRect } from '../utils/selectionUtils';
import { useChatContext } from '../contexts/ChatContext';

export default function SelectionToolbar({ containerRef, onHighlight, onComment, onOpenNotes, onAskAboutSelection }) {
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

    const toolbarHeight = 36;
    const margin = 8;

    let top = rect.top - toolbarHeight - margin;
    let left = rect.left + rect.width / 2;

    if (top < margin) {
      top = rect.bottom + margin;
    }

    left = Math.max(100, Math.min(left, window.innerWidth - 100));

    setPosition({ top, left });
    setVisible(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.toString().trim().length === 0) {
        if (!commentMode) setVisible(false);
        return;
      }
      // Only show toolbar when selection is inside the PDF container
      if (containerRef?.current) {
        const range = sel.getRangeAt(0);
        if (!containerRef.current.contains(range.commonAncestorContainer)) return;
      }
      updatePosition();
    }, 10);
  }, [updatePosition, commentMode, containerRef]);

  const dismiss = useCallback(() => {
    setVisible(false);
    setCommentMode(false);
    setCommentText('');
  }, []);

  useEffect(() => {
    // Listen on document so toolbar appears even when mouse is released outside the PDF container
    document.addEventListener('mouseup', handleMouseUp);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', handleKeyDown);

    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target) && !commentMode) {
        const sel = window.getSelection();
        if (!sel || sel.toString().trim().length === 0) {
          dismiss();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleMouseUp, dismiss, commentMode]);

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

  const toolBtn = (label, onClick, color = '#888') => (
    <Tooltip title={label}>
      <Box
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          color,
          fontFamily: 'monospace',
          fontSize: '0.7rem',
          fontWeight: 700,
          px: 0.75,
          py: 0.25,
          '&:hover': { color: '#E5E5E5' },
        }}
      >
        {label}
      </Box>
    </Tooltip>
  );

  return createPortal(
    <Box
      ref={toolbarRef}
      // Prevent mousedown from clearing the text selection — this is the key fix
      // that allows onClick handlers to still read window.getSelection()
      onMouseDown={(e) => e.preventDefault()}
      sx={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
        zIndex: 1400,
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        px: 0.5,
        py: 0.25,
        bgcolor: '#0D0D0D',
        border: '1px solid #333333',
      }}
    >
      {!commentMode ? (
        <>
          {toolBtn('[HL]', handleHighlight, '#f59e0b')}
          {toolBtn('[NOTE]', handleNote)}
          {toolBtn('[CMT]', handleCommentToggle)}
          {toolBtn('[AI?]', () => {
            const sel = window.getSelection();
            const text = sel ? sel.toString().trim() : '';
            if (text) {
              if (onAskAboutSelection) {
                onAskAboutSelection(text);
              } else if (sendMessage) {
                sendMessage(`Explain this passage: "${text}"`);
              }
            }
            dismiss();
            sel?.removeAllRanges();
          }, '#00FF00')}
        </>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.25 }}>
          <TextField
            size="small"
            placeholder="COMMENT..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCommentSubmit();
              }
            }}
            autoFocus
            sx={{
              width: 180,
              '& .MuiInputBase-input': {
                fontSize: '0.75rem',
                py: 0.5,
                fontFamily: 'monospace',
              },
            }}
          />
          <Box
            onClick={commentText.trim() ? handleCommentSubmit : undefined}
            sx={{
              cursor: commentText.trim() ? 'pointer' : 'default',
              color: commentText.trim() ? '#00FF00' : '#555',
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              fontWeight: 700,
              '&:hover': commentText.trim() ? { color: '#E5E5E5' } : {},
            }}
          >
            [OK]
          </Box>
        </Box>
      )}
    </Box>,
    document.body
  );
}
