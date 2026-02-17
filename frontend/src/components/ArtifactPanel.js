import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Tooltip, Button } from '@mui/material';
import { useChatContext } from '../contexts/ChatContext';

function MermaidDiagram({ code }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, theme: 'dark' });
        if (cancelled || !containerRef.current) return;
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = `<pre style="white-space:pre-wrap;font-size:0.8rem;color:#E5E5E5">${code}</pre>`;
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

  // Track user answers: array of selected option indices (null = unanswered)
  const [userAnswers, setUserAnswers] = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());

  const handleSelectOption = (questionIndex, optionIndex) => {
    if (submitted) return; // Disable after submission
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleRetry = () => {
    setUserAnswers(Array(questions.length).fill(null));
    setSubmitted(false);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.correct_index) correct++;
    });
    return correct;
  };

  const allAnswered = userAnswers.every(a => a !== null);
  const score = submitted ? calculateScore() : 0;
  const percentage = submitted ? Math.round((score / questions.length) * 100) : 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Results banner */}
      {submitted && (
        <Box
          sx={{
            border: `2px solid ${percentage >= 70 ? '#00FF00' : percentage >= 50 ? '#FFAA00' : '#FF0000'}`,
            p: 1.5,
            textAlign: 'center',
            bgcolor: '#0A0A0A',
          }}
        >
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: '#E5E5E5', mb: 0.5 }}>
            SCORE: {score}/{questions.length} ({percentage}%)
          </Typography>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#888' }}>
            {percentage >= 70 ? '✓ EXCELLENT' : percentage >= 50 ? '○ GOOD' : '✗ NEEDS REVIEW'}
          </Typography>
        </Box>
      )}

      {/* Questions */}
      {questions.map((q, qIdx) => {
        const userAnswer = userAnswers[qIdx];
        const isCorrect = userAnswer === q.correct_index;

        return (
          <Box key={qIdx} sx={{ border: '1px solid #333', p: 1.5 }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: '#E5E5E5', mb: 1 }}>
              Q{qIdx + 1}: {q.question}
            </Typography>

            {/* Options */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {q.options?.map((opt, optIdx) => {
                const isSelected = userAnswer === optIdx;
                const isCorrectOption = optIdx === q.correct_index;

                // Determine color and style based on state
                let bgcolor = '#0D0D0D';
                let borderColor = '#333';
                let textColor = '#AAA';
                let fontWeight = 400;

                if (submitted) {
                  if (isCorrectOption) {
                    // Correct answer: always highlight green
                    bgcolor = '#001A00';
                    borderColor = '#00FF00';
                    textColor = '#00FF00';
                    fontWeight = 700;
                  } else if (isSelected) {
                    // User's wrong answer: highlight red
                    bgcolor = '#1A0000';
                    borderColor = '#FF0000';
                    textColor = '#FF0000';
                    fontWeight = 700;
                  }
                } else if (isSelected) {
                  // Selected but not submitted: highlight yellow
                  bgcolor = '#1A1A00';
                  borderColor = '#FFAA00';
                  textColor = '#FFAA00';
                  fontWeight = 700;
                }

                return (
                  <Box
                    key={optIdx}
                    onClick={() => handleSelectOption(qIdx, optIdx)}
                    sx={{
                      p: 1,
                      border: `1px solid ${borderColor}`,
                      bgcolor,
                      cursor: submitted ? 'default' : 'pointer',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: textColor,
                      fontWeight,
                      transition: 'all 0.2s',
                      '&:hover': submitted ? {} : {
                        borderColor: '#666',
                        bgcolor: '#1A1A1A',
                      },
                    }}
                  >
                    {String.fromCharCode(65 + optIdx)}) {opt}
                  </Box>
                );
              })}
            </Box>

            {/* Explanation (show after submission) */}
            {submitted && q.explanation && (
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: isCorrect ? '#00FF00' : '#888', mt: 1, fontStyle: 'italic' }}>
                {`// ${q.explanation}`}
              </Typography>
            )}
          </Box>
        );
      })}

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        {!submitted ? (
          <Tooltip title={allAnswered ? '' : 'Answer all questions first'}>
            <span>
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered}
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: allAnswered ? '#00FF00' : '#555',
                  border: `1px solid ${allAnswered ? '#00FF00' : '#333'}`,
                  px: 2,
                  py: 0.5,
                  '&:hover': allAnswered ? {
                    bgcolor: '#001A00',
                    borderColor: '#00FF00',
                  } : {},
                  '&:disabled': {
                    color: '#555',
                    borderColor: '#333',
                  },
                }}
              >
                [SUBMIT]
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Button
            onClick={handleRetry}
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#888',
              border: '1px solid #333',
              px: 2,
              py: 0.5,
              '&:hover': {
                color: '#E5E5E5',
                borderColor: '#666',
                bgcolor: '#1A1A1A',
              },
            }}
          >
            [RETRY]
          </Button>
        )}
      </Box>
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
      return <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', fontFamily: 'monospace', color: '#E5E5E5' }}>{artifact.content}</pre>;
    }
  }

  const text = artifact.instruction || artifact.context || JSON.stringify(artifact, null, 2);
  return (
    <Box sx={{ border: '1px solid #333', p: 1.5, overflow: 'auto', maxHeight: 400 }}>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', margin: 0, fontFamily: 'monospace', color: '#E5E5E5' }}>{text}</pre>
    </Box>
  );
}

export default function ArtifactPanel() {
  const { artifacts, clearArtifacts } = useChatContext();

  if (!artifacts || artifacts.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', bgcolor: '#000000' }}>
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
          ARTIFACTS ({artifacts.length})
        </Typography>
        <Tooltip title="Close">
          <Box onClick={clearArtifacts} sx={{ cursor: 'pointer', color: '#888', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, '&:hover': { color: '#E5E5E5' } }}>
            [x]
          </Box>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {artifacts.map((artifact, i) => (
          <Box key={i} sx={{ border: '1px solid #333333', p: 1.5 }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#888', mb: 1, textTransform: 'uppercase' }}>
              {`// ${artifact.artifact_type || 'artifact'}${artifact.topic ? ` - ${artifact.topic}` : ''}`}
            </Typography>
            <ArtifactRenderer artifact={artifact} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
