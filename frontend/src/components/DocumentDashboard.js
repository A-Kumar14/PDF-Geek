import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Divider, Chip, CircularProgress, Tooltip, IconButton,
} from '@mui/material';
import { X, BookOpen, Clock, BarChart2, Zap, MessageSquare, HelpCircle, Activity } from 'lucide-react';
import apiClient from '../api/client';
import MasteryHeatmap from './MasteryHeatmap';

function MetaBlock({ icon, label, value }) {
    return (
        <Box
            sx={{
                flex: '1 1 140px',
                border: '1px solid var(--border)',
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                background: 'var(--bg-tertiary)',
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: 'var(--border-focus)' },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'var(--fg-dim)' }}>
                {icon}
                <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'inherit' }}>
                    {label}
                </Typography>
            </Box>
            <Typography sx={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>
                {value ?? '—'}
            </Typography>
        </Box>
    );
}

function SummaryCard({ summary, loading }) {
    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, border: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
                <CircularProgress size={14} sx={{ color: 'var(--accent)' }} />
                <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--fg-dim)' }}>
          // generating summary...
                </Typography>
            </Box>
        );
    }
    if (!summary) return null;
    return (
        <Box sx={{ p: 2, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', position: 'relative' }}>
            <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--fg-dim)', mb: 1, textTransform: 'uppercase' }}>
        // auto-generated abstract
            </Typography>
            <Typography sx={{ fontFamily: 'var(--font-family)', fontSize: '0.85rem', color: 'var(--fg-primary)', lineHeight: 1.6 }}>
                {summary}
            </Typography>
        </Box>
    );
}

function ActivityFeed({ messages = [], quizResults = [] }) {
    const combined = [
        ...messages.map((m) => ({ type: 'message', ...m })),
        ...quizResults.map((q) => ({ type: 'quiz', ...q })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 12);

    if (combined.length === 0) {
        return (
            <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--fg-dim)', py: 2 }}>
        // no activity yet — start a chat or generate a quiz
            </Typography>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 260, overflow: 'auto' }} className="custom-scrollbar">
            {combined.map((item, idx) => (
                <Box
                    key={idx}
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        p: 1,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        gap: 1,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, flex: 1, minWidth: 0 }}>
                        {item.type === 'quiz' ? (
                            <HelpCircle size={12} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                        ) : (
                            <MessageSquare size={12} color="var(--fg-dim)" style={{ flexShrink: 0, marginTop: 2 }} />
                        )}
                        <Typography
                            sx={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.72rem',
                                color: 'var(--fg-secondary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {item.type === 'quiz'
                                ? `QUIZ: ${item.topic || 'untitled'} — ${item.score}/${item.total_questions}`
                                : item.content || '(no preview)'}
                        </Typography>
                    </Box>
                    <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--fg-dim)', flexShrink: 0 }}>
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}

export default function DocumentDashboard({ sessionId, documentName, onClose }) {
    const [activity, setActivity] = useState(null);
    const [masteryData, setMasteryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summary, setSummary] = useState(null);

    const fetchData = useCallback(async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const [actRes, masteryRes] = await Promise.all([
                apiClient.get(`/sessions/${sessionId}/activity`),
                apiClient.get(`/flashcards/progress/summary/${sessionId}`),
            ]);
            setActivity(actRes.data);
            setMasteryData(masteryRes.data);
        } catch (err) {
            console.error('DocumentDashboard fetch failed', err);
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fc = activity?.flashcard_summary || {};
    const totalCards = fc.total || 0;
    const knownPct = totalCards > 0 ? Math.round((fc.known / totalCards) * 100) : 0;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                bgcolor: 'var(--bg-primary)',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1.25,
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    flexShrink: 0,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BookOpen size={14} color="var(--accent)" />
                    <Typography sx={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--fg-primary)' }}>
                        DOCUMENT_DASHBOARD
                    </Typography>
                    {documentName && (
                        <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--fg-dim)' }}>
              // {documentName}
                        </Typography>
                    )}
                </Box>
                {onClose && (
                    <Tooltip title="Close dashboard">
                        <IconButton size="small" onClick={onClose} sx={{ color: 'var(--fg-dim)', '&:hover': { color: 'var(--fg-primary)' } }}>
                            <X size={14} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <CircularProgress size={20} sx={{ color: 'var(--accent)' }} />
                </Box>
            ) : (
                <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }} className="custom-scrollbar">

                    {/* Metadata blocks */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <MetaBlock icon={<MessageSquare size={12} />} label="AI Exchanges" value={activity?.recent_messages?.length ?? 0} />
                        <MetaBlock icon={<HelpCircle size={12} />} label="Quizzes Taken" value={activity?.quiz_results?.length ?? 0} />
                        <MetaBlock icon={<Zap size={12} />} label="Cards Known" value={`${knownPct}%`} />
                        <MetaBlock icon={<Activity size={12} />} label="Cards Total" value={totalCards} />
                    </Box>

                    {/* Summary */}
                    <Box>
                        <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--fg-dim)', mb: 1, textTransform: 'uppercase' }}>
              // Document Summary
                        </Typography>
                        <SummaryCard summary={summary} loading={summaryLoading} />
                        {!summary && !summaryLoading && (
                            <Box
                                onClick={() => {
                                    setSummaryLoading(true);
                                    // Summary is generated via the chat endpoint — placeholder
                                    setTimeout(() => {
                                        setSummary('AI-generated summary will appear here after the first summarize request. Use /summarize in the Command Palette or ask the AI to summarize this document.');
                                        setSummaryLoading(false);
                                    }, 800);
                                }}
                                sx={{
                                    cursor: 'pointer',
                                    border: '1px dashed var(--border)',
                                    p: 1.5,
                                    textAlign: 'center',
                                    '&:hover': { borderColor: 'var(--accent)', background: 'var(--accent-dim)' },
                                    transition: 'all 0.15s',
                                }}
                            >
                                <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--fg-dim)' }}>
                                    [CLICK TO GENERATE SUMMARY]
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Mastery Heatmap */}
                    {masteryData?.groups?.length > 0 && (
                        <Box>
                            <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--fg-dim)', mb: 1, textTransform: 'uppercase' }}>
                // Mastery Heatmap
                            </Typography>
                            <MasteryHeatmap groups={masteryData.groups} />
                        </Box>
                    )}

                    <Divider sx={{ borderColor: 'var(--border)' }} />

                    {/* Activity Feed */}
                    <Box>
                        <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--fg-dim)', mb: 1, textTransform: 'uppercase' }}>
              // Activity History
                        </Typography>
                        <ActivityFeed
                            messages={activity?.recent_messages || []}
                            quizResults={activity?.quiz_results || []}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
}
