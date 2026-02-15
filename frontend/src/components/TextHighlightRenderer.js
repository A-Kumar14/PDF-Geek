import React, { useMemo } from 'react';
import { Tooltip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAnnotations } from '../contexts/AnnotationContext';

export default function TextHighlightRenderer({ content }) {
  const { highlights, comments, removeHighlight, removeComment } = useAnnotations();

  // Merge highlights and comments into sorted, non-overlapping segments
  const rendered = useMemo(() => {
    const allMarks = [
      ...highlights
        .filter((h) => h.startOffset != null && h.endOffset != null)
        .map((h) => ({ ...h, type: 'highlight' })),
      ...comments
        .filter((c) => c.startOffset != null && c.endOffset != null)
        .map((c) => ({ ...c, type: 'comment' })),
    ].sort((a, b) => a.startOffset - b.startOffset);

    if (allMarks.length === 0) return content;

    const parts = [];
    let lastEnd = 0;

    allMarks.forEach((mark) => {
      const start = Math.max(mark.startOffset, lastEnd);
      const end = mark.endOffset;
      if (start >= end) return;

      // Text before this mark
      if (start > lastEnd) {
        parts.push(content.slice(lastEnd, start));
      }

      const markedText = content.slice(start, end);
      if (mark.type === 'highlight') {
        parts.push(
          <Tooltip
            key={mark.id}
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                Highlight
                <IconButton
                  size="small"
                  onClick={() => removeHighlight(mark.id)}
                  sx={{ color: '#fff' }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
            }
            arrow
          >
            <mark
              style={{
                backgroundColor: mark.color || 'rgba(255, 235, 59, 0.5)',
                borderRadius: 2,
                padding: '0 1px',
                cursor: 'pointer',
              }}
            >
              {markedText}
            </mark>
          </Tooltip>
        );
      } else {
        parts.push(
          <Tooltip
            key={mark.id}
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <strong>{mark.comment}</strong>
                <IconButton
                  size="small"
                  onClick={() => removeComment(mark.id)}
                  sx={{ color: '#fff' }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
            }
            arrow
          >
            <mark
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.25)',
                borderBottom: '2px dashed rgba(139, 92, 246, 0.7)',
                borderRadius: 2,
                padding: '0 1px',
                cursor: 'pointer',
              }}
            >
              {markedText}
            </mark>
          </Tooltip>
        );
      }

      lastEnd = end;
    });

    // Remaining text
    if (lastEnd < content.length) {
      parts.push(content.slice(lastEnd));
    }

    return parts;
  }, [content, highlights, comments, removeHighlight, removeComment]);

  return <>{rendered}</>;
}
