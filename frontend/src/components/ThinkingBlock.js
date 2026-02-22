import React, { useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CircularProgress from '@mui/material/CircularProgress';

export default function ThinkingBlock({ steps, isGenerating }) {
    const [expanded, setExpanded] = useState(false);

    if (!steps || steps.length === 0) return null;

    return (
        <Box
            sx={{
                alignSelf: 'flex-start',
                maxWidth: '85%',
                mb: 1,
                borderLeft: '2px solid var(--accent, #00FF00)',
                bgcolor: 'var(--accent-dim, rgba(0,255,0,0.1))',
                borderRadius: '0 4px 4px 0',
                overflow: 'hidden',
            }}
        >
            <Box
                onClick={() => setExpanded(!expanded)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 0.75,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                }}
            >
                {isGenerating ? (
                    <CircularProgress size={12} sx={{ color: 'var(--accent, #00FF00)' }} />
                ) : (
                    <CheckCircleOutlineIcon sx={{ fontSize: 14, color: 'var(--accent, #00FF00)' }} />
                )}
                <Typography
                    sx={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: 'var(--accent, #00FF00)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        flex: 1,
                    }}
                >
                    {isGenerating ? `[ REASONING... ] (${steps.length} steps)` : `[ REASONING LOG ] (${steps.length} steps)`}
                </Typography>
                <IconButton size="small" disableRipple sx={{ p: 0, color: 'var(--accent, #00FF00)' }}>
                    {expanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                </IconButton>
            </Box>

            <Collapse in={expanded}>
                <Box sx={{ p: 1.5, pt: 0 }}>
                    {steps.map((step, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 0.5, alignItems: 'flex-start' }}>
                            <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--fg-dim)', mt: 0.25 }}>
                                {String(idx + 1).padStart(2, '0')}
                            </Typography>
                            <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--fg-secondary)' }}>
                                {step.type === 'tool_call' ? `[EXECUTING_TOOL] ${step.name}` : step.content}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Collapse>
        </Box>
    );
}
