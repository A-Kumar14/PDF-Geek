import React, { useEffect, useRef } from 'react';
import { Box, Typography, IconButton, Paper, alpha, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useChatContext } from '../contexts/ChatContext';

function MermaidDiagram({ code }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, theme: 'default' });
        if (cancelled || !containerRef.current) return;
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = `<pre style="white-space:pre-wrap;font-size:0.85rem">${code}</pre>`;
        }
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  return <Box ref={containerRef} sx={{ overflow: 'auto', maxHeight: 400, p: 1 }} />;
}

function QuizCard({ data }) {
  if (!data) return null;
  const questions = Array.isArray(data) ? data : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {questions.map((q, i) => (
        <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Q{i + 1}: {q.question}
          </Typography>
          {q.options?.map((opt, j) => (
            <Typography
              key={j}
              variant="body2"
              sx={{
                py: 0.25,
                pl: 1,
                fontWeight: j === q.correct_index ? 700 : 400,
                color: j === q.correct_index ? 'success.main' : 'text.primary',
              }}
            >
              {String.fromCharCode(65 + j)}) {opt}
            </Typography>
          ))}
          {q.explanation && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {q.explanation}
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
}

function ArtifactRenderer({ artifact }) {
  const type = artifact.artifact_type || artifact.viz_type || 'unknown';

  if (type === 'visualization' && artifact.viz_type === 'mermaid' && artifact.content) {
    return <MermaidDiagram code={artifact.content} />;
  }

  if (type === 'quiz' && artifact.content) {
    try {
      const data = typeof artifact.content === 'string' ? JSON.parse(artifact.content) : artifact.content;
      return <QuizCard data={data} />;
    } catch {
      return <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{artifact.content}</pre>;
    }
  }

  // Fallback: render instruction or context as formatted text
  const text = artifact.instruction || artifact.context || JSON.stringify(artifact, null, 2);
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, overflow: 'auto', maxHeight: 400 }}>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', margin: 0 }}>{text}</pre>
    </Paper>
  );
}

export default function ArtifactPanel() {
  const { artifacts, clearArtifacts } = useChatContext();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!artifacts || artifacts.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
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
          Artifacts ({artifacts.length})
        </Typography>
        <IconButton size="small" onClick={clearArtifacts}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {artifacts.map((artifact, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, isDark ? 0.05 : 0.03),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', textTransform: 'capitalize' }}>
              {artifact.artifact_type || 'artifact'} {artifact.topic ? `- ${artifact.topic}` : ''}
            </Typography>
            <ArtifactRenderer artifact={artifact} />
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
