import React, { useRef, useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { Box, TextField, IconButton, Typography, LinearProgress, Menu, MenuItem, Dialog, DialogContent } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import { useChatContext } from '../contexts/ChatContext';
import { useFile } from '../contexts/FileContext';
import { useModelContext } from '../contexts/ModelContext';
import VoiceInput from './VoiceInput';
import SuggestionChips from './SuggestionChips';
import SuggestedPrompts from './SuggestedPrompts';
import FlashcardPopupDialog from './FlashcardPopupDialog';
import QuizFlashcardDialog from './QuizFlashcardDialog';

const CHAT_MODELS = [
  { id: 'gemini-2.0-flash', label: 'GEMINI 2.0', badge: 'FREE' },
  { id: 'gpt-4o-mini', label: 'GPT-4o MINI', badge: 'FREE' },
  { id: 'gemini-2.5-pro', label: 'GEMINI 2.5 PRO', badge: 'PRO' },
  { id: 'gpt-4o', label: 'GPT-4o', badge: 'PRO' },
];

const MarkdownRenderer = lazy(() => import('./MarkdownRenderer'));

export default function ChatPanel() {
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const { activeSessionId, messages, addMessage, isLoading, streamingContent, stopGeneration, startNewSession, chatSessions } = useChatContext();
  const { file, goToSourcePage } = useFile();
  const { selectedModel, setSelectedModel } = useModelContext();

  const [input, setInput] = useState('');
  const [showPrompts, setShowPrompts] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [modelMenuAnchor, setModelMenuAnchor] = useState(null);

  // ── Flashcard / Quiz quick-generate state ────────────────────────────────
  const [fcDialogData, setFcDialogData] = useState(null);   // {cards, topic}
  const [quizDialogData, setQuizDialogData] = useState(null); // [questions]
  const [topicPrompt, setTopicPrompt] = useState(null);      // 'flashcards' | 'quiz' | null
  const [topicInput, setTopicInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  const API = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const handleQuickGenerate = async (type, topic) => {
    setGenerating(true);
    setGenError('');
    const token = localStorage.getItem('filegeek-token');
    try {
      // Resolve session — use active session, fall back to most recent, or create one.
      let sessionId = activeSessionId;
      if (!sessionId) {
        // Try the most recently updated session in list
        if (chatSessions && chatSessions.length > 0) {
          sessionId = chatSessions[0].id;
        } else {
          // Create a fresh session
          const docName = file?.name || 'Document';
          sessionId = await startNewSession(docName, 'pdf');
        }
      }
      if (!sessionId) {
        throw new Error('No active session. Open a document and start a chat first.');
      }

      const endpoint = type === 'flashcards' ? '/flashcards/generate' : '/quiz/generate';
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ session_id: sessionId, topic: topic || 'the document', num_cards: 8 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      if (type === 'flashcards') {
        setFcDialogData({ cards: data.cards, topic: data.topic });
      } else {
        setQuizDialogData(data.questions || data.cards || []);
      }
      setTopicPrompt(null);
      setTopicInput('');
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const activeModelLabel = CHAT_MODELS.find(m => m.id === selectedModel)?.label || selectedModel.toUpperCase();

  const handleCopy = (id, content) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => { });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !file) || isLoading) return;

    const userMsg = input;
    setInput('');
    setShowPrompts(false);
    await addMessage(userMsg);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setInput((prev) => prev + (prev ? ' ' : '') + transcript);
  };

  // Combine messages with streaming content for display
  const displayMessages = useMemo(() => {
    if (!streamingContent) return messages;
    return [
      ...messages,
      {
        id: 'streaming-temp',
        role: 'assistant',
        content: streamingContent,
        isStreaming: true,
      },
    ];
  }, [messages, streamingContent]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#000000', color: '#E5E5E5', fontFamily: 'monospace' }}>

      {/* Header / Top Info */}
      <Box sx={{ p: 1, borderBottom: '1px solid #333333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#888888' }}>
          [ SESSION_ACTIVE ]
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#00FF00', animation: 'statusPulse 2.5s ease-in-out infinite' }}>
            ONLINE
          </Typography>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {displayMessages.length === 0 && showPrompts ? (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
            <Box sx={{ textAlign: 'center', opacity: 0.7 }}>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700, mb: 1 }}>
                Input Required
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#888' }}>
                Awaiting commands or queries...
              </Typography>
            </Box>
            <SuggestedPrompts
              onSelect={(prompt) => {
                setInput(prompt);
                // Optional: auto-submit or just fill
              }}
            />
          </Box>
        ) : (
          displayMessages.map((msg, index) => (
            <Box
              key={msg.id || index}
              sx={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              {/* Custom Message Bubble for Brutalist Theme */}
              <Box
                sx={{
                  border: msg.role === 'user' ? '1px solid #E5E5E5' : '1px solid #333333',
                  bgcolor: msg.role === 'user' ? '#000000' : '#0D0D0D',
                  p: 1.5,
                  position: 'relative',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: -10,
                    left: 10,
                    bgcolor: '#000000',
                    px: 0.5,
                    fontFamily: 'monospace',
                    color: msg.role === 'user' ? '#E5E5E5' : '#888888',
                    fontSize: '0.7rem'
                  }}
                >
                  {msg.role === 'user' ? '[ USER ]' : '[ SYS ]'}
                </Typography>

                {msg.role === 'assistant' && !msg.isStreaming && (
                  <Box
                    onClick={() => handleCopy(msg.id || index, msg.content)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      cursor: 'pointer',
                      color: copiedId === (msg.id || index) ? '#00FF00' : '#555555',
                      fontFamily: 'monospace',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      '&:hover': { color: '#E5E5E5' },
                    }}
                  >
                    {copiedId === (msg.id || index) ? '[OK]' : '[CPY]'}
                  </Box>
                )}

                {/* Message Content */}
                {msg.role === 'assistant' ? (
                  <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.6, '& p': { m: 0, mb: 0.5 }, '& pre': { background: '#111', p: 1, borderRadius: 0, overflow: 'auto', border: '1px solid #333' }, '& code': { fontFamily: 'monospace', fontSize: '0.8rem', background: '#111', px: 0.5 }, '& h1,& h2,& h3': { mt: 1, mb: 0.5 }, '& ul,& ol': { pl: 2, mt: 0.5, mb: 0.5 }, '& table': { borderCollapse: 'collapse', width: '100%' }, '& th,& td': { border: '1px solid #333', p: 0.5 } }}>
                    <Suspense fallback={<Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.content}</Typography>}>
                      <MarkdownRenderer content={msg.content} />
                    </Suspense>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {msg.content}
                  </Typography>
                )}

                {msg.isStreaming && (
                  <Box sx={{ display: 'inline-block', ml: 1, width: 8, height: 16, bgcolor: '#00FF00', animation: 'blink 1s step-end infinite' }} />
                )}
              </Box>

              {/* Source chips — clickable, navigate + highlight PDF */}
              {msg.role === 'assistant' && !msg.isStreaming && msg.sources?.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {msg.sources.map((src, i) => (
                    <Box
                      key={i}
                      onClick={() => goToSourcePage(src)}
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.65rem',
                        color: '#00FF88',
                        border: '1px solid rgba(0,255,136,0.4)',
                        px: 0.75,
                        py: 0.25,
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': { bgcolor: 'rgba(0,255,136,0.1)' },
                      }}
                    >
                      [SRC:{src.pages?.[0] || '?'}]
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))
        )}

        {isLoading && !streamingContent && (
          <Box sx={{ alignSelf: 'flex-start', maxWidth: '85%', border: '1px solid #333333', p: 2 }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#888' }}>[ PROCESSING REQUEST ]</Typography>
            <LinearProgress sx={{ mt: 1, bgcolor: '#333333', '& .MuiLinearProgress-bar': { bgcolor: '#00FF00' } }} />
          </Box>
        )}
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: '1px solid #333333', bgcolor: '#000000' }}>
        <SuggestionChips onSelect={(chip) => setInput(chip)} />

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            border: '1px solid #333333',
            p: 0.5, // Reduced padding tightens the look
            '&:focus-within': {
              border: '1px solid #E5E5E5'
            }
          }}
        >
          <Box sx={{ pl: 1, color: '#00FF00', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.2rem' }}>
            {'>'}
          </Box>
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="ENTER_COMMAND..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                fontFamily: 'monospace',
                color: '#E5E5E5',
                fontSize: '0.9rem',
                '& ::placeholder': { color: '#666', opacity: 1 }
              }
            }}
          />

          {/* Inline Model Selector pill */}
          <Box
            onClick={(e) => setModelMenuAnchor(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              border: '1px solid #333',
              px: 1,
              py: 0.25,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              '&:hover': { borderColor: '#E5E5E5' },
            }}
          >
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#00FF00', fontWeight: 700 }}>
              {activeModelLabel}
            </Typography>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#555' }}>▾</Typography>
          </Box>

          <Menu
            anchorEl={modelMenuAnchor}
            open={Boolean(modelMenuAnchor)}
            onClose={() => setModelMenuAnchor(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            PaperProps={{
              sx: {
                bgcolor: '#0D0D0D',
                border: '1px solid #333',
                borderRadius: 0,
                mt: -0.5,
              },
            }}
          >
            <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                SELECT MODEL
              </Typography>
            </Box>
            {CHAT_MODELS.map((m) => (
              <MenuItem
                key={m.id}
                selected={m.id === selectedModel}
                onClick={() => { setSelectedModel(m.id); setModelMenuAnchor(null); }}
                sx={{
                  py: 0.5,
                  px: 1.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  '&.Mui-selected': { bgcolor: 'rgba(0,255,0,0.08)', borderLeft: '2px solid #00FF00' },
                  '&:hover': { bgcolor: '#1A1A1A' },
                }}
              >
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#E5E5E5', fontWeight: m.id === selectedModel ? 700 : 400 }}>
                  {m.label}
                </Typography>
                <Typography sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.6rem',
                  color: m.badge === 'FREE' ? '#00FF00' : '#FF00FF',
                  border: `1px solid ${m.badge === 'FREE' ? '#00FF00' : '#FF00FF'}`,
                  px: 0.5,
                }}>
                  {m.badge}
                </Typography>
              </MenuItem>
            ))}
          </Menu>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {!isLoading ? (
              <IconButton
                type="submit"
                disabled={!input.trim()}
                sx={{
                  color: '#E5E5E5',
                  borderRadius: 0,
                  '&:hover': { bgcolor: '#333333' },
                  '&.Mui-disabled': { color: '#444' }
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            ) : (
              <IconButton
                onClick={stopGeneration}
                sx={{
                  color: '#FF0000',
                  borderRadius: 0,
                  '&:hover': { bgcolor: '#330000' }
                }}
              >
                <StopIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, gap: 1 }}>
          {/* Quick-action buttons */}
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Box
              onClick={() => { setTopicPrompt('flashcards'); setTopicInput(''); setGenError(''); }}
              sx={{
                fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700,
                color: '#888', border: '1px solid #2A2A2A', px: 1.25, py: 0.4,
                cursor: 'pointer', userSelect: 'none',
                '&:hover': { color: '#FFAA00', borderColor: '#FFAA00' },
              }}
            >
              [⚡ FLASHCARDS]
            </Box>
            <Box
              onClick={() => { setTopicPrompt('quiz'); setTopicInput(''); setGenError(''); }}
              sx={{
                fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700,
                color: '#888', border: '1px solid #2A2A2A', px: 1.25, py: 0.4,
                cursor: 'pointer', userSelect: 'none',
                '&:hover': { color: '#00FF00', borderColor: '#00FF00' },
              }}
            >
              [📝 QUIZ]
            </Box>
          </Box>
          <VoiceInput onTranscript={handleVoiceTranscript} />
        </Box>
      </Box>

      {/* Topic prompt mini-dialog */}
      <Dialog
        open={Boolean(topicPrompt)}
        onClose={() => setTopicPrompt(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#0D0D0D', border: '1px solid #333', borderRadius: 0 } }}
      >
        <DialogContent sx={{ p: 2 }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#888', mb: 1.5 }}>
            // Generate {topicPrompt} from this session
          </Typography>
          <TextField
            autoFocus
            fullWidth
            placeholder={`Topic (e.g. "memory management") — leave blank for full doc`}
            value={topicInput}
            onChange={e => setTopicInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleQuickGenerate(topicPrompt, topicInput); }}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: { fontFamily: 'monospace', fontSize: '0.85rem', color: '#E5E5E5', border: '1px solid #333', px: 1, py: 0.5 },
            }}
          />
          {genError && (
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#FF4444', mt: 1 }}>{genError}</Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
            <Box onClick={() => setTopicPrompt(null)} sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#555', cursor: 'pointer', '&:hover': { color: '#E5E5E5' } }}>[CANCEL]</Box>
            <Box
              onClick={() => !generating && handleQuickGenerate(topicPrompt, topicInput)}
              sx={{
                fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700,
                color: generating ? '#444' : '#00FF00',
                border: `1px solid ${generating ? '#333' : '#00FF00'}`,
                px: 1.5, py: 0.25, cursor: generating ? 'default' : 'pointer',
                '&:hover': generating ? {} : { bgcolor: '#001A00' },
              }}
            >
              {generating ? '[ GENERATING... ]' : '[ GENERATE ]'}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Flashcard popup */}
      <FlashcardPopupDialog
        open={Boolean(fcDialogData)}
        onClose={() => setFcDialogData(null)}
        cards={fcDialogData?.cards || []}
        topic={fcDialogData?.topic}
        messageId={null}
        sessionId={activeSessionId}
      />

      {/* Quiz popup */}
      <QuizFlashcardDialog
        open={Boolean(quizDialogData)}
        onClose={() => setQuizDialogData(null)}
        questions={quizDialogData || []}
      />

      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </Box>
  );
}
