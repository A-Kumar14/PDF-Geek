import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

const STATUS_COLORS = {
    known: 'var(--success, #00FF00)',
    reviewing: 'var(--warning, #FFAA00)',
    remaining: 'var(--border, #333333)',
};

const STATUS_LABELS = {
    known: 'Mastered',
    reviewing: 'Reviewing',
    remaining: 'Not started',
};

function CardDot({ card }) {
    const color = STATUS_COLORS[card.status] || STATUS_COLORS.remaining;
    return (
        <Tooltip
            title={
                <Box sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', p: 0.25 }}>
                    <Box sx={{ fontWeight: 700, mb: 0.25 }}>{card.front || `Card ${card.card_index + 1}`}</Box>
                    <Box sx={{ color: color }}>{STATUS_LABELS[card.status] || 'remaining'}</Box>
                    {card.review_count > 0 && (
                        <Box sx={{ color: 'var(--fg-dim)' }}>
                            Reviews: {card.review_count} · Ease: {card.ease_factor?.toFixed(1)}
                        </Box>
                    )}
                    {card.next_review_date && (
                        <Box sx={{ color: 'var(--fg-dim)' }}>
                            Due: {new Date(card.next_review_date).toLocaleDateString()}
                        </Box>
                    )}
                </Box>
            }
            arrow
            placement="top"
        >
            <Box
                sx={{
                    width: 14,
                    height: 14,
                    bgcolor: color,
                    opacity: card.status === 'remaining' ? 0.3 : 1,
                    cursor: 'default',
                    transition: 'transform 0.1s, opacity 0.1s',
                    '&:hover': { transform: 'scale(1.4)', opacity: 1, zIndex: 10 },
                    flexShrink: 0,
                }}
            />
        </Tooltip>
    );
}

export default function MasteryHeatmap({ groups = [] }) {
    if (!groups || groups.length === 0) {
        return (
            <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--fg-dim)' }}>
        // No flashcard data yet
            </Typography>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 2, mb: 0.5 }}>
                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                    <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, bgcolor: STATUS_COLORS[status], opacity: status === 'remaining' ? 0.35 : 1 }} />
                        <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {label}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Groups (each message_id = one flashcard set) */}
            {groups.map((group, gi) => {
                const cards = group.cards || [];
                const known = cards.filter((c) => c.status === 'known').length;
                const pct = cards.length > 0 ? Math.round((known / cards.length) * 100) : 0;

                return (
                    <Box
                        key={group.message_id || gi}
                        sx={{
                            border: '1px solid var(--border)',
                            p: 1.25,
                            background: 'var(--bg-tertiary)',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--fg-dim)', letterSpacing: '0.08em' }}>
                                FLASHCARD SET #{gi + 1}
                            </Typography>
                            <Typography sx={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, color: pct >= 80 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--fg-dim)' }}>
                                {pct}% mastered
                            </Typography>
                        </Box>

                        {/* Dot grid */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {cards.map((card, ci) => (
                                <CardDot key={ci} card={card} />
                            ))}
                        </Box>

                        {/* Per-set progress bar */}
                        <Box sx={{ mt: 1, height: 3, bgcolor: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    height: '100%',
                                    width: `${pct}%`,
                                    bgcolor: pct >= 80 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--accent)',
                                    transition: 'width 0.5s ease',
                                }}
                            />
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}
