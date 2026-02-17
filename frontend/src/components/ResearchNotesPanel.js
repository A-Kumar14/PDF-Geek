import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import SmartCitation from './SmartCitation';
import { useHighlights } from '../contexts/HighlightsContext';
import { useChatContext } from '../contexts/ChatContext';

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div',
    'sup', 'sub', 'del', 'hr',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'title', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
};

function sanitize(content) {
  if (!content) return '';
  return DOMPurify.sanitize(content, PURIFY_CONFIG);
}

function relativeTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function ResearchNotesPanel() {
  const { pinnedNotes, toggleNotesPanel, unpinNote, clearAllNotes } = useHighlights();
  const { sendMessage } = useChatContext();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', bgcolor: '#000000' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: '1px solid #333333',
        }}
      >
        <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: '#E5E5E5' }}>
          RESEARCH_NOTES ({pinnedNotes.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {pinnedNotes.length > 0 && (
            <Tooltip title="Clear all">
              <Box onClick={clearAllNotes} sx={{ cursor: 'pointer', color: '#888', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, '&:hover': { color: '#FF0000' } }}>
                [CLR]
              </Box>
            </Tooltip>
          )}
          <Box onClick={toggleNotesPanel} sx={{ cursor: 'pointer', color: '#888', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, '&:hover': { color: '#E5E5E5' } }}>
            [x]
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {pinnedNotes.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', px: 2 }}>
            <Typography sx={{ fontFamily: 'monospace', color: '#888', fontSize: '0.8rem', mb: 1 }}>
              [NO_NOTES]
            </Typography>
            <Typography sx={{ fontFamily: 'monospace', color: '#555', fontSize: '0.7rem' }}>
              Pin AI responses to save them here.
            </Typography>
          </Box>
        ) : (
          pinnedNotes.map((note) => (
            <Box
              key={note.id}
              sx={{
                border: '1px solid #333333',
                p: 1.5,
              }}
            >
              {/* Top row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {note.fileName && (
                  <Typography sx={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#888', border: '1px solid #333', px: 0.5 }}>
                    {note.fileName.length > 20 ? note.fileName.slice(0, 17) + '...' : note.fileName}
                  </Typography>
                )}
                <Typography sx={{ ml: 'auto', fontSize: '0.6rem', fontFamily: 'monospace', color: '#555' }}>
                  {relativeTime(note.pinnedAt)}
                </Typography>
                <Tooltip title="Re-ask">
                  <Box onClick={() => sendMessage(note.question)} sx={{ cursor: 'pointer', color: '#888', fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700, '&:hover': { color: '#00FF00' } }}>
                    [^]
                  </Box>
                </Tooltip>
                <Tooltip title="Unpin">
                  <Box onClick={() => unpinNote(note.id)} sx={{ cursor: 'pointer', color: '#888', fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700, '&:hover': { color: '#FF0000' } }}>
                    [x]
                  </Box>
                </Tooltip>
              </Box>

              {/* Question */}
              {note.question && (
                <Typography sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#E5E5E5',
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {'> '}{note.question}
                </Typography>
              )}

              {/* Answer */}
              <Box
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: '#AAA',
                  lineHeight: 1.6,
                  '& p': { m: 0, mb: 0.5 },
                  '& pre': { p: 1, overflow: 'auto', bgcolor: '#0D0D0D', border: '1px solid #333', fontSize: '0.7rem' },
                  '& code': { fontFamily: 'monospace', color: '#00FF00' },
                  '& table': {
                    borderCollapse: 'collapse',
                    width: '100%',
                    '& th, & td': { border: '1px solid #333', px: 1, py: 0.5, fontSize: '0.7rem' },
                  },
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {sanitize(note.answer)}
                </ReactMarkdown>
              </Box>

              {/* Sources */}
              {note.sources?.length > 0 && (
                <Box sx={{ mt: 1, pt: 0.5, borderTop: '1px solid #222' }}>
                  {note.sources.map((src, i) => (
                    <SmartCitation key={i} source={src} />
                  ))}
                </Box>
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
