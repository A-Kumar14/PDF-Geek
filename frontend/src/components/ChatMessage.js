import React from 'react';
import { Box, Paper } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import SmartCitation from './SmartCitation';
import AudioPlayer from './AudioPlayer';
import ExportMenu from './ExportMenu';
import FeedbackButtons from './FeedbackButtons';
import SuggestionChips from './SuggestionChips';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 1 }}>
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
        ) : (
          <>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeHighlight, rehypeKatex]}
            >
              {message.content}
            </ReactMarkdown>
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
            {/* Actions: Feedback + Audio + Export */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <FeedbackButtons messageId={message.message_id} />
              <AudioPlayer text={message.content} />
              <ExportMenu content={message.content} title="FileGeek Response" />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
