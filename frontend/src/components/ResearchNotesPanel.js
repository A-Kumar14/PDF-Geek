import React from 'react';
import { Box, Typography, IconButton, Paper, Chip, Tooltip, alpha, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PushPinIcon from '@mui/icons-material/PushPin';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ReplayIcon from '@mui/icons-material/Replay';
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
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ResearchNotesPanel() {
  const { pinnedNotes, toggleNotesPanel, unpinNote, clearAllNotes } = useHighlights();
  const { sendMessage } = useChatContext();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          Research Notes ({pinnedNotes.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {pinnedNotes.length > 0 && (
            <Tooltip title="Clear all notes">
              <IconButton size="small" onClick={clearAllNotes}>
                <DeleteSweepIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small" onClick={toggleNotesPanel}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {pinnedNotes.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              px: 3,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.12 : 0.08),
                mb: 2.5,
              }}
            >
              <PushPinIcon sx={{ fontSize: 28, color: 'primary.main' }} />
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em', mb: 0.5 }}>
              No notes yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 240, lineHeight: 1.6 }}>
              Pin AI responses to save them here for quick reference across all your documents.
            </Typography>
          </Box>
        ) : (
          pinnedNotes.map((note) => (
            <Paper
              key={note.id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.05 : 0.03),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              {/* Top row: file chip + timestamp + unpin */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {note.fileName && (
                  <Chip
                    label={note.fileName.length > 25 ? note.fileName.slice(0, 22) + '...' : note.fileName}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 22, borderRadius: '6px' }}
                  />
                )}
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', whiteSpace: 'nowrap' }}>
                  {relativeTime(note.pinnedAt)}
                </Typography>
                <Tooltip title="Unpin">
                  <IconButton size="small" onClick={() => unpinNote(note.id)} sx={{ ml: 0.5, p: 0.5 }}>
                    <PushPinIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Question */}
              {note.question && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 0.5 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {note.question}
                  </Typography>
                  <Tooltip title="Re-ask this question" arrow>
                    <IconButton
                      size="small"
                      onClick={() => sendMessage(note.question)}
                      sx={{ p: 0.25, flexShrink: 0 }}
                    >
                      <ReplayIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}

              {/* Answer */}
              <Box
                sx={{
                  '& p': { m: 0, fontSize: '0.85rem' },
                  '& pre': { borderRadius: 1, p: 1, overflow: 'auto', bgcolor: 'background.default', fontSize: '0.8rem' },
                  '& table': {
                    borderCollapse: 'collapse',
                    width: '100%',
                    '& th, & td': { border: '1px solid', borderColor: 'divider', px: 1, py: 0.5 },
                  },
                  maxHeight: 300,
                  overflow: 'auto',
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {sanitize(note.answer)}
                </ReactMarkdown>
              </Box>

              {/* Sources */}
              {note.sources?.length > 0 && (
                <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                  {note.sources.map((src, i) => (
                    <SmartCitation key={i} source={src} />
                  ))}
                </Box>
              )}
            </Paper>
          ))
        )}
      </Box>
    </Box>
  );
}
