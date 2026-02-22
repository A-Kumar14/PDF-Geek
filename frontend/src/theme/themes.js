/**
 * FileGeek Theme Definitions
 * Each theme is a map of CSS custom-property names → values.
 * ThemeContext injects these on `document.documentElement`.
 */

export const THEMES = {
    brutalist_dark: {
        '--bg-primary': '#0D0D0D',
        '--bg-secondary': '#111111',
        '--bg-tertiary': '#1A1A1A',
        '--bg-hover': '#222222',
        '--fg-primary': '#E5E5E5',
        '--fg-secondary': '#AAAAAA',
        '--fg-dim': '#666666',
        '--accent': '#00FF00',
        '--accent-dim': 'rgba(0,255,0,0.15)',
        '--accent-glow': '0 0 12px rgba(0,255,0,0.4)',
        '--border': '#333333',
        '--border-focus': '#555555',
        '--error': '#FF4444',
        '--warning': '#FFAA00',
        '--success': '#00FF00',
        '--shadow': '0 4px 24px rgba(0,0,0,0.8)',
    },
    paper_white: {
        '--bg-primary': '#F8F9FA',
        '--bg-secondary': '#FFFFFF',
        '--bg-tertiary': '#F0F2F5',
        '--bg-hover': '#E8EAED',
        '--fg-primary': '#1A1A2E',
        '--fg-secondary': '#4A4A6A',
        '--fg-dim': '#9A9AB0',
        '--accent': '#0070F3',
        '--accent-dim': 'rgba(0,112,243,0.1)',
        '--accent-glow': '0 0 12px rgba(0,112,243,0.3)',
        '--border': '#E2E8F0',
        '--border-focus': '#CBD5E1',
        '--error': '#DC2626',
        '--warning': '#D97706',
        '--success': '#059669',
        '--shadow': '0 4px 24px rgba(0,0,0,0.08)',
    },
    cyber_amber: {
        '--bg-primary': '#000000',
        '--bg-secondary': '#050505',
        '--bg-tertiary': '#0A0A0A',
        '--bg-hover': '#0D0D0D',
        '--fg-primary': '#FFBF00',
        '--fg-secondary': '#CC9900',
        '--fg-dim': '#664C00',
        '--accent': '#FFD700',
        '--accent-dim': 'rgba(255,191,0,0.1)',
        '--accent-glow': '0 0 20px rgba(255,191,0,0.6), 0 0 40px rgba(255,191,0,0.2)',
        '--border': '#332600',
        '--border-focus': '#FFBF00',
        '--error': '#FF0000',
        '--warning': '#FF4500',
        '--success': '#39FF14',
        '--shadow': '0 4px 24px rgba(255,191,0,0.15)',
    },
    solarized: {
        '--bg-primary': '#F4ECD8',
        '--bg-secondary': '#EDE0C4',
        '--bg-tertiary': '#E8D9B7',
        '--bg-hover': '#DDD0AA',
        '--fg-primary': '#2C1810',
        '--fg-secondary': '#5C3D2E',
        '--fg-dim': '#A08060',
        '--accent': '#8B4513',
        '--accent-dim': 'rgba(139,69,19,0.1)',
        '--accent-glow': '0 0 12px rgba(139,69,19,0.3)',
        '--border': '#C4A882',
        '--border-focus': '#A08060',
        '--error': '#C0392B',
        '--warning': '#D35400',
        '--success': '#27AE60',
        '--shadow': '0 4px 24px rgba(0,0,0,0.15)',
    },
};

export const FONTS = {
    inter_sans: { '--font-family': "'Inter', system-ui, sans-serif", '--font-mono': "'JetBrains Mono', 'Courier New', monospace" },
    jetbrains_mono: { '--font-family': "'JetBrains Mono', 'Courier New', monospace", '--font-mono': "'JetBrains Mono', 'Courier New', monospace" },
    open_dyslexic: { '--font-family': "'OpenDyslexic', 'Comic Sans MS', sans-serif", '--font-mono': "'OpenDyslexic Mono', 'Courier New', monospace" },
};

export const DENSITY = {
    compact: { '--spacing-unit': '4px', '--radius': '2px', '--line-height': '1.4' },
    spacious: { '--spacing-unit': '8px', '--radius': '6px', '--line-height': '1.7' },
};

export const THEME_NAMES = ['brutalist_dark', 'paper_white', 'cyber_amber', 'solarized'];
export const FONT_NAMES = ['jetbrains_mono', 'inter_sans', 'open_dyslexic'];
export const DENSITY_NAMES = ['compact', 'spacious'];
