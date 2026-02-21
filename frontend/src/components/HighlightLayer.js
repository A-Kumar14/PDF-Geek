import React from 'react';
import { Tooltip, Box } from '@mui/material';
import { useAnnotations } from '../contexts/AnnotationContext';

const HighlightLayer = React.memo(
  function HighlightLayer({ pageNum, scale, sourceHighlights = [] }) {
    const { highlights, comments, removeHighlight, removeComment } = useAnnotations();

    const pageHighlights = highlights.filter((h) => h.pageNum === pageNum);
    const pageComments = comments.filter((c) => c.pageNum === pageNum);
    const pageSourceHighlights = sourceHighlights.filter((s) => s.page === pageNum);

    if (pageHighlights.length === 0 && pageComments.length === 0 && pageSourceHighlights.length === 0) return null;

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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                  <span>{h.text.slice(0, 60)}{h.text.length > 60 ? '...' : ''}</span>
                  <Box
                    component="span"
                    onClick={() => removeHighlight(h.id)}
                    sx={{ cursor: 'pointer', color: '#FF0000', fontWeight: 700, pointerEvents: 'auto', ml: 0.5 }}
                  >
                    [x]
                  </Box>
                </Box>
              }
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
                  mixBlendMode: 'screen',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                }}
              />
            </Tooltip>
          ))
        )}
        {/* Source highlights — green accent from [SRC:N] chip clicks */}
        {pageSourceHighlights.map((s, si) =>
          s.rects.map((rect, i) => (
            <div
              key={`source-${si}-${i}`}
              style={{
                position: 'absolute',
                left: rect.x * scale,
                top: rect.y * scale,
                width: rect.width * scale,
                height: rect.height * scale,
                backgroundColor: 'rgba(0,255,136,0.25)',
                border: '2px solid rgba(0,255,136,0.6)',
                pointerEvents: 'none',
              }}
            />
          ))
        )}

        {pageComments.map((c) =>
          c.rects.map((rect, i) => (
            <Tooltip
              key={`comment-${c.id}-${i}`}
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                  <strong>{c.comment}</strong>
                  <Box
                    component="span"
                    onClick={() => removeComment(c.id)}
                    sx={{ cursor: 'pointer', color: '#FF0000', fontWeight: 700, pointerEvents: 'auto', ml: 0.5 }}
                  >
                    [x]
                  </Box>
                </Box>
              }
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
                  mixBlendMode: 'screen',
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
  },
  (prevProps, nextProps) => {
    // Only re-render if pageNum, scale, or sourceHighlights changes
    return (
      prevProps.pageNum === nextProps.pageNum &&
      prevProps.scale === nextProps.scale &&
      prevProps.sourceHighlights === nextProps.sourceHighlights
    );
  }
);

export default HighlightLayer;
