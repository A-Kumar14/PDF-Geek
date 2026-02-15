import React from 'react';
import { Tooltip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAnnotations } from '../contexts/AnnotationContext';

export default function HighlightLayer({ pageNum, scale }) {
  const { highlights, comments, removeHighlight, removeComment } = useAnnotations();

  const pageHighlights = highlights.filter((h) => h.pageNum === pageNum);
  const pageComments = comments.filter((c) => c.pageNum === pageNum);

  if (pageHighlights.length === 0 && pageComments.length === 0) return null;

  return (
    <div
      className="highlight-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      {pageHighlights.map((h) =>
        h.rects.map((rect, i) => (
          <Tooltip
            key={`${h.id}-${i}`}
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {h.text.slice(0, 60)}{h.text.length > 60 ? '...' : ''}
                <IconButton
                  size="small"
                  onClick={() => removeHighlight(h.id)}
                  sx={{ color: '#fff', pointerEvents: 'auto', ml: 0.5 }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
            }
            arrow
            placement="top"
          >
            <div
              className="highlight-overlay"
              style={{
                position: 'absolute',
                left: rect.x * scale,
                top: rect.y * scale,
                width: rect.width * scale,
                height: rect.height * scale,
                backgroundColor: h.color || 'rgba(255, 235, 59, 0.4)',
                mixBlendMode: 'multiply',
                borderRadius: 2,
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
            />
          </Tooltip>
        ))
      )}
      {pageComments.map((c) =>
        c.rects.map((rect, i) => (
          <Tooltip
            key={`comment-${c.id}-${i}`}
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <strong>{c.comment}</strong>
                <IconButton
                  size="small"
                  onClick={() => removeComment(c.id)}
                  sx={{ color: '#fff', pointerEvents: 'auto', ml: 0.5 }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
            }
            arrow
            placement="top"
          >
            <div
              style={{
                position: 'absolute',
                left: rect.x * scale,
                top: rect.y * scale,
                width: rect.width * scale,
                height: rect.height * scale,
                backgroundColor: 'rgba(139, 92, 246, 0.25)',
                mixBlendMode: 'multiply',
                borderRadius: 2,
                borderBottom: '2px dashed rgba(139, 92, 246, 0.7)',
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
            />
          </Tooltip>
        ))
      )}
    </div>
  );
}
