import React, { useRef, useState } from 'react';
import { Box, TextField, IconButton, Typography, Menu, MenuItem } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import { useChatContext } from '../contexts/ChatContext';
import { useModelContext } from '../contexts/ModelContext';

const CHAT_MODELS = [
    { id: 'gemini-2.0-flash', label: 'GEMINI 2.0', badge: 'FREE' },
    { id: 'gpt-4o-mini', label: 'GPT-4o MINI', badge: 'FREE' },
    { id: 'gemini-2.5-pro', label: 'GEMINI 2.5 PRO', badge: 'PRO' },
    { id: 'gpt-4o', label: 'GPT-4o', badge: 'PRO' },
];

export default function GlobalCommandBar() {
    const inputRef = useRef(null);
    const { addMessage, isLoading, stopGeneration, activeSessionId } = useChatContext();
    const { selectedModel, setSelectedModel } = useModelContext();

    const [input, setInput] = useState('');
    const [modelMenuAnchor, setModelMenuAnchor] = useState(null);

    const activeModelLabel = CHAT_MODELS.find(m => m.id === selectedModel)?.label || selectedModel.toUpperCase();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        // Auto-detect commands
        let userMsg = input;
        if (userMsg.startsWith('//')) {
            // Example extension point for local terminal commands or socratic parsing.
            userMsg = userMsg.replace('//', '').trim();
        }

        setInput('');
        // Optionally focus document after submit
        await addMessage(userMsg);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '90%',
                maxWidth: 720, // Keep narrow like a terminal prompt
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'var(--bg-secondary, #111)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                boxShadow: 'var(--shadow)',
                p: 1,
                transition: 'border-color 0.15s, box-shadow 0.15s',
                '&:focus-within': {
                    border: '1px solid var(--accent)',
                    boxShadow: 'var(--accent-glow)',
                }
            }}
        >
            <Box sx={{ pl: 1, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}>
                {'//'}
            </Box>
            <TextField
                inputRef={inputRef}
                fullWidth
                multiline
                maxRows={4}
                placeholder="Enter command or query..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                variant="standard"
                disabled={!activeSessionId}
                InputProps={{
                    disableUnderline: true,
                    sx: {
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--fg-primary)',
                        fontSize: '0.9rem',
                        '& ::placeholder': { color: 'var(--fg-dim)', opacity: 1 }
                    }
                }}
            />

            {/* Inline Model Selector */}
            <Box
                onClick={(e) => setModelMenuAnchor(e.currentTarget)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    px: 1,
                    py: 0.25,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    '&:hover': { borderColor: 'var(--fg-primary)' },
                }}
            >
                <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700 }}>
                    {activeModelLabel}
                </Typography>
                <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--fg-dim)' }}>▾</Typography>
            </Box>

            <Menu
                anchorEl={modelMenuAnchor}
                open={Boolean(modelMenuAnchor)}
                onClose={() => setModelMenuAnchor(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        bgcolor: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        mt: -1,
                        boxShadow: 'var(--shadow)',
                    },
                }}
            >
                <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
                    <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
                            '&.Mui-selected': { bgcolor: 'var(--accent-dim)', borderLeft: '2px solid var(--accent)' },
                            '&:hover': { bgcolor: 'var(--bg-hover)' },
                        }}
                    >
                        <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--fg-primary)', fontWeight: m.id === selectedModel ? 700 : 400 }}>
                            {m.label}
                        </Typography>
                        <Typography sx={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.6rem',
                            color: m.badge === 'FREE' ? 'var(--accent)' : '#FF00FF',
                            border: `1px solid ${m.badge === 'FREE' ? 'var(--accent)' : '#FF00FF'}`,
                            px: 0.5,
                            borderRadius: '2px',
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
                        disabled={!input.trim() || !activeSessionId}
                        sx={{
                            color: 'var(--fg-primary)',
                            borderRadius: '4px',
                            p: 0.5,
                            '&:hover': { bgcolor: 'var(--bg-hover)' },
                            '&.Mui-disabled': { color: 'var(--fg-dim)' }
                        }}
                    >
                        <SendIcon fontSize="small" />
                    </IconButton>
                ) : (
                    <IconButton
                        onClick={stopGeneration}
                        sx={{
                            color: 'var(--error)',
                            borderRadius: '4px',
                            p: 0.5,
                            '&:hover': { bgcolor: 'var(--bg-hover)' }
                        }}
                    >
                        <StopIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
}
