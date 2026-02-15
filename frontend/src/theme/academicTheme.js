import { createTheme, alpha } from '@mui/material/styles';

// ── Design tokens ──────────────────────────────────────────────────────
// Linear-style dark mode: desaturated neutrals + indigo accent
// Light mode: clean slate with same accent family

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: { main: '#5E6AD2', light: '#7B85DC', dark: '#4850A8' },
          secondary: { main: '#6B7280' },
          background: { default: '#F8F9FB', paper: '#FFFFFF' },
          text: { primary: '#111827', secondary: '#6B7280' },
          divider: alpha('#94A3B8', 0.2),
          action: {
            hover: alpha('#5E6AD2', 0.06),
            selected: alpha('#5E6AD2', 0.1),
          },
        }
      : {
          primary: { main: '#5E6AD2', light: '#8B93E8', dark: '#4850A8' },
          secondary: { main: '#9CA3AF' },
          background: { default: '#121212', paper: '#1A1A2E' },
          text: { primary: '#E5E7EB', secondary: '#9CA3AF' },
          divider: alpha('#E5E7EB', 0.08),
          action: {
            hover: alpha('#5E6AD2', 0.1),
            selected: alpha('#5E6AD2', 0.16),
          },
        }),
  },
  typography: {
    fontFamily: "'Inter', 'Source Sans Pro', system-ui, -apple-system, sans-serif",
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    body1: { lineHeight: 1.7 },
    body2: { lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
    overline: { letterSpacing: '0.08em', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
});

// ── Glassmorphism helpers ──────────────────────────────────────────────

const glass = (mode) => ({
  bg: mode === 'light'
    ? alpha('#FFFFFF', 0.65)
    : alpha('#1A1A2E', 0.6),
  border: mode === 'light'
    ? `1px solid ${alpha('#94A3B8', 0.15)}`
    : `1px solid ${alpha('#E5E7EB', 0.06)}`,
  blur: 'blur(16px) saturate(180%)',
  shadow: mode === 'light'
    ? '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)'
    : '0 1px 3px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
});

// ── Theme factory ──────────────────────────────────────────────────────

export default function createAcademicTheme(mode) {
  const tokens = getDesignTokens(mode);
  const g = glass(mode);

  const theme = createTheme({
    ...tokens,
    components: {
      // ── Global baseline ──
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: mode === 'light'
              ? '#F8F9FB'
              : '#121212',
            minHeight: '100vh',
          },
          // Better LaTeX rendering
          '.katex': {
            fontSize: '1.1em !important',
            lineHeight: '1.8 !important',
          },
          '.math-display': {
            overflowX: 'auto',
            padding: '8px 0',
          },
          // Smooth scrollbars
          '*::-webkit-scrollbar': { width: 6 },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': {
            background: alpha(mode === 'light' ? '#000' : '#fff', 0.15),
            borderRadius: 3,
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: alpha(mode === 'light' ? '#000' : '#fff', 0.25),
          },
        },
      },

      // ── AppBar (glassmorphic) ──
      MuiAppBar: {
        styleOverrides: {
          root: {
            backdropFilter: g.blur,
            backgroundColor: g.bg,
            border: g.border,
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            boxShadow: 'none',
          },
        },
      },

      // ── Drawer (glassmorphic) ──
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backdropFilter: g.blur,
            backgroundColor: g.bg,
            borderRight: g.border,
          },
        },
      },

      // ── Paper (flat, no image background) ──
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },

      // ── Buttons ──
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            padding: '6px 16px',
            transition: 'all 0.15s ease',
            '&:hover': {
              boxShadow: g.shadow,
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: `0 4px 12px ${alpha('#5E6AD2', 0.3)}`,
            },
          },
        },
      },

      // ── IconButton ──
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'all 0.15s ease',
            '&:hover': {
              transform: 'scale(1.08)',
              backgroundColor: tokens.palette.action?.hover,
            },
          },
        },
      },

      // ── Chip (micro-interaction) ──
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            transition: 'all 0.15s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: g.shadow,
            },
          },
          outlined: {
            borderWidth: 1,
            borderColor: tokens.palette.divider,
          },
        },
      },

      // ── TextField ──
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: tokens.palette.divider,
              transition: 'border-color 0.2s ease',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha('#5E6AD2', 0.4),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#5E6AD2',
              borderWidth: 1.5,
            },
          },
        },
      },

      // ── Dialog / Modal (glassmorphic) ──
      MuiDialog: {
        styleOverrides: {
          paper: {
            backdropFilter: g.blur,
            backgroundColor: g.bg,
            border: g.border,
            boxShadow: mode === 'dark'
              ? '0 24px 48px rgba(0,0,0,0.4)'
              : '0 24px 48px rgba(0,0,0,0.12)',
          },
        },
      },

      // ── Tooltip ──
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backdropFilter: 'blur(8px)',
            backgroundColor: mode === 'light'
              ? alpha('#111827', 0.9)
              : alpha('#1A1A2E', 0.95),
            fontSize: '0.75rem',
            borderRadius: 6,
          },
        },
      },

      // ── Select ──
      MuiSelect: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: tokens.palette.divider,
            },
          },
        },
      },

      // ── Menu ──
      MuiMenu: {
        styleOverrides: {
          paper: {
            backdropFilter: g.blur,
            backgroundColor: g.bg,
            border: g.border,
            boxShadow: mode === 'dark'
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(0,0,0,0.12)',
          },
        },
      },
    },
  });
  return theme;
}
