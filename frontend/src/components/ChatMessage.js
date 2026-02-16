import React, { useState, useCallback, useRef } from 'react';
import { Box, Paper, IconButton, Tooltip, Typography, Collapse, alpha, useTheme } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ReplayIcon from '@mui/icons-material/Replay';
import SmartCitation from './SmartCitation';
import AudioPlayer from './AudioPlayer';
import ExportMenu from './ExportMenu';
import FeedbackButtons from './FeedbackButtons';
import SuggestionChips from './SuggestionChips';
import { useHighlights } from '../contexts/HighlightsContext';
import { useFile } from '../contexts/FileContext';
import { useChatContext } from '../contexts/ChatContext';

// Copy-to-clipboard button for code blocks
function CopyCodeButton({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };
  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy code'} arrow>
      <IconButton
        size="small"
        onClick={handleCopy}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          color: 'text.secondary',
          bgcolor: 'background.paper',
          opacity: 0.7,
          '&:hover': { opacity: 1, bgcolor: 'background.paper' },
          p: 0.5,
          zIndex: 1,
        }}
      >
        {copied ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
      </IconButton>
    </Tooltip>
  );
}

// Custom pre renderer to wrap code blocks with copy button
function CodeBlockWrapper({ children, ...props }) {
  const codeText = extractTextFromChildren(children);
  return (
    <Box sx={{ position: 'relative' }}>
      <CopyCodeButton code={codeText} />
      <pre {...props}>{children}</pre>
    </Box>
  );
}

function extractTextFromChildren(children) {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join('');
  if (children?.props?.children) return extractTextFromChildren(children.props.children);
  return '';
}

// DOMPurify config: allow standard HTML + safe attributes, block data-attrs
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'span', 'div',
    'sup', 'sub', 'del', 'hr',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'title', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
};

function sanitize(content) {
  if (!content) return '';
  return DOMPurify.sanitize(content, PURIFY_CONFIG);
}

// Threshold in pixels before we offer collapse
const COLLAPSE_HEIGHT = 300;

function relativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ChatMessage({ message, previousUserMessage }) {
  const isUser = message.role === 'user';
  const theme = useTheme();
  const { pinNote, unpinNote, isNotePinned, getPinnedNoteByMessageId } = useHighlights();
  const { file } = useFile();
  const { sendMessage } = useChatContext();
  const [expanded, setExpanded] = useState(true);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const [pinAnimating, setPinAnimating] = useState(false);
  const contentRef = useRef(null);

  const isPinned = !isUser && isNotePinned(message.message_id);

  // Check if content exceeds collapse threshold after render
  const measuredRef = useCallback((node) => {
    if (node && !isUser) {
      contentRef.current = node;
      // Use requestAnimationFrame to measure after paint
      requestAnimationFrame(() => {
        if (node.scrollHeight > COLLAPSE_HEIGHT) {
          setNeedsCollapse(true);
          setExpanded(false);
        }
      });
    }
  }, [isUser]);

  const handleTogglePin = () => {
    if (isPinned) {
      const note = getPinnedNoteByMessageId(message.message_id);
      if (note) unpinNote(note.id);
    } else {
      setPinAnimating(true);
      setTimeout(() => setPinAnimating(false), 400);
      pinNote({
        messageId: message.message_id,
        question: previousUserMessage?.content || '',
        answer: message.content,
        sources: message.sources || [],
        fileName: file?.name || '',
      });
    }
  };

  return (
    <Box
      sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 1 }}
      role="listitem"
      aria-label={isUser ? 'Your message' : 'Assistant response'}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: '72%',
          px: 2,
          py: 1.2,
          borderRadius: 3,
          bgcolor: isUser ? 'primary.main' : 'action.hover',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          '& p': { m: 0 },
          '& pre': {
            borderRadius: 1,
            p: 1.5,
            overflow: 'auto',
            bgcolor: 'background.default',
            fontSize: '0.85rem',
          },
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            '& th, & td': { border: '1px solid', borderColor: 'divider', px: 1, py: 0.5 },
          },
          '& .math-display': { overflowX: 'auto' },
        }}
      >
        {isUser ? (
          <p style={{ margin: 0 }}>{message.content}</p>
        ) : message.isError ? (
          <Box>
            <Typography variant="body2" color="error" sx={{ fontSize: '0.85rem' }}>
              {message.content}
            </Typography>
            {message.failedQuestion && (
              <Tooltip title="Retry this question" arrow>
                <IconButton
                  size="small"
                  onClick={() => sendMessage(message.failedQuestion)}
                  sx={{ mt: 0.5, color: 'primary.main' }}
                >
                  <ReplayIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ) : (
          <>
            <Collapse in={expanded} collapsedSize={needsCollapse ? COLLAPSE_HEIGHT : undefined}>
              <Box ref={measuredRef}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeHighlight, rehypeKatex]}
                  components={{ pre: CodeBlockWrapper }}
                >
                  {sanitize(message.content)}
                </ReactMarkdown>
              </Box>
            </Collapse>
            {needsCollapse && (
              <Box
                onClick={() => setExpanded((prev) => !prev)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  py: 0.5,
                  color: 'primary.main',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {expanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                {expanded ? 'Show less' : 'Show more'}
              </Box>
            )}
            {message.sources?.length > 0 && (
              <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                {message.sources.map((src, i) => (
                  <SmartCitation key={i} source={src} />
                ))}
              </Box>
            )}
            {/* Suggestions */}
            {message.suggestions?.length > 0 && (
              <SuggestionChips suggestions={message.suggestions} />
            )}
            {/* Actions: Pin + Feedback + Audio + Export */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
              role="toolbar"
              aria-label="Message actions"
            >
              <Tooltip title={isPinned ? 'Unpin from notes' : 'Pin to notes'}>
                <IconButton
                  size="small"
                  onClick={handleTogglePin}
                  sx={{
                    color: isPinned ? 'primary.main' : 'text.secondary',
                    bgcolor: isPinned ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    },
                    p: 0.5,
                  }}
                  aria-label={isPinned ? 'Unpin from research notes' : 'Pin to research notes'}
                >
                  {isPinned
                    ? <PushPinIcon sx={{ fontSize: 18, animation: pinAnimating ? 'pinPulse 0.4s ease' : 'none' }} />
                    : <PushPinOutlinedIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>
              <FeedbackButtons messageId={message.message_id} />
              <AudioPlayer text={message.content} />
              <ExportMenu content={message.content} title="FileGeek Response" />
              {message.timestamp && (
                <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto', fontSize: '0.7rem' }}>
                  {relativeTime(message.timestamp)}
                </Typography>
              )}
            </Box>
          </>
        )}
        {/* Timestamp for user messages */}
        {isUser && message.timestamp && (
          <Typography variant="caption" color="inherit" sx={{ opacity: 0.6, fontSize: '0.65rem', mt: 0.25, display: 'block', textAlign: 'right' }}>
            {relativeTime(message.timestamp)}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
