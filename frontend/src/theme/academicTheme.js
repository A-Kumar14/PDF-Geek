import { createTheme } from '@mui/material/styles';

// ── Brutalist Design Tokens ─────────────────────────────────────────
// High-Contrast Technical Minimalism: black, monospace, zero ornamentation

const COLORS = {
  black: '#000000',
  carbon: '#0D0D0D',
  border: '#333333',
  textPrimary: '#E5E5E5',
  textSecondary: '#888888',
  accent: '#00FF00',
  error: '#FF0000',
  dim: '#444444',
};

export default function createAcademicTheme() {
  return createTheme({
    palette: {
      mode: 'dark',
      primary: { main: COLORS.accent, light: COLORS.accent, dark: '#00CC00' },
      secondary: { main: COLORS.textSecondary },
      background: { default: COLORS.black, paper: COLORS.carbon },
      text: { primary: COLORS.textPrimary, secondary: COLORS.textSecondary },
      divider: COLORS.border,
      error: { main: COLORS.error },
      action: {
        hover: 'rgba(255, 255, 255, 0.05)',
        selected: 'rgba(0, 255, 0, 0.1)',
      },
    },
    typography: {
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      h4: { fontWeight: 700, letterSpacing: '0.05em' },
      h5: { fontWeight: 700, letterSpacing: '0.03em' },
      h6: { fontWeight: 700, letterSpacing: '0.02em' },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.5, fontSize: '0.875rem' },
      button: { textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' },
      caption: { letterSpacing: '0.05em', fontWeight: 500 },
      overline: { letterSpacing: '0.1em', fontWeight: 700 },
    },
    shape: { borderRadius: 0 },
    components: {
      // ── Global baseline ──
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: COLORS.black,
            color: COLORS.textPrimary,
            minHeight: '100vh',
          },
          '*::-webkit-scrollbar': { width: 8 },
          '*::-webkit-scrollbar-track': { background: COLORS.carbon },
          '*::-webkit-scrollbar-thumb': {
            background: COLORS.border,
            border: `1px solid ${COLORS.black}`,
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: COLORS.textPrimary,
          },
        },
      },

      // ── AppBar ──
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: COLORS.black,
            borderBottom: `1px solid ${COLORS.border}`,
            boxShadow: 'none',
            backdropFilter: 'none',
          },
        },
      },

      // ── Drawer ──
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: COLORS.black,
            borderRight: `1px solid ${COLORS.border}`,
            backdropFilter: 'none',
          },
        },
      },

      // ── Paper ──
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: COLORS.carbon,
            borderRadius: 0,
            boxShadow: 'none',
          },
        },
      },

      // ── Buttons ──
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            boxShadow: 'none',
            padding: '6px 16px',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            transition: 'none',
            '&:hover': {
              boxShadow: 'none',
              transform: 'none',
              backgroundColor: COLORS.border,
            },
          },
          contained: {
            backgroundColor: COLORS.textPrimary,
            color: COLORS.black,
            '&:hover': {
              backgroundColor: '#FFFFFF',
            },
          },
          outlined: {
            borderColor: COLORS.border,
            color: COLORS.textPrimary,
            '&:hover': {
              borderColor: COLORS.textPrimary,
              backgroundColor: 'transparent',
            },
          },
        },
      },

      // ── IconButton ──
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            transition: 'none',
            color: COLORS.textSecondary,
            '&:hover': {
              transform: 'none',
              backgroundColor: COLORS.border,
              color: COLORS.textPrimary,
            },
          },
        },
      },

      // ── Chip ──
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            transition: 'none',
            '&:hover': {
              transform: 'none',
              boxShadow: 'none',
            },
          },
          outlined: {
            borderWidth: 1,
            borderColor: COLORS.border,
          },
        },
      },

      // ── TextField ──
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            fontFamily: "'JetBrains Mono', monospace",
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: COLORS.border,
              borderRadius: 0,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: COLORS.textSecondary,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: COLORS.accent,
              borderWidth: 1,
            },
          },
        },
      },

      // ── Dialog ──
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: COLORS.carbon,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 0,
            boxShadow: 'none',
            backdropFilter: 'none',
          },
        },
      },

      // ── Tooltip ──
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: COLORS.carbon,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textPrimary,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            borderRadius: 0,
            backdropFilter: 'none',
          },
          arrow: {
            color: COLORS.border,
          },
        },
      },

      // ── Select ──
      MuiSelect: {
        styleOverrides: {
          root: {
            fontFamily: "'JetBrains Mono', monospace",
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: COLORS.border,
            },
          },
        },
      },

      // ── Menu ──
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: COLORS.carbon,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 0,
            boxShadow: 'none',
            backdropFilter: 'none',
          },
        },
      },

      // ── MenuItem ──
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontFamily: "'JetBrains Mono', monospace",
            borderRadius: 0,
            '&.Mui-selected': {
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(0, 255, 0, 0.15)',
              },
            },
            '&:hover': {
              backgroundColor: COLORS.border,
            },
          },
        },
      },

      // ── ListItemButton ──
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            transition: 'none',
            '&.Mui-selected': {
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
            },
            '&:hover': {
              backgroundColor: COLORS.border,
            },
          },
        },
      },

      // ── Switch ──
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: COLORS.accent,
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: COLORS.accent,
            },
          },
        },
      },

      // ── Badge ──
      MuiBadge: {
        styleOverrides: {
          badge: {
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            borderRadius: 0,
          },
        },
      },

      // ── LinearProgress ──
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: COLORS.border,
            borderRadius: 0,
          },
          bar: {
            backgroundColor: COLORS.accent,
            borderRadius: 0,
          },
        },
      },

      // ── Tabs ──
      MuiTab: {
        styleOverrides: {
          root: {
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: '0.05em',
          },
        },
      },

      // ── Alert ──
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            border: `1px solid ${COLORS.border}`,
          },
        },
      },

      // ── Divider ──
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: COLORS.border,
          },
        },
      },

      // ── TextField ──
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-root': {
              fontFamily: "'JetBrains Mono', monospace",
            },
          },
        },
      },
    },
  });
}
