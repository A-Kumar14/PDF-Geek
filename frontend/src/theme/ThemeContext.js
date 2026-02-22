import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { THEMES, FONTS, DENSITY } from './themes';

const ThemeContext = createContext({
  themeName: 'brutalist_dark',
  font: 'jetbrains_mono',
  density: 'compact',
  layoutMode: 'analyst',
  setTheme: () => { },
  setFont: () => { },
  toggleDensity: () => { },
  setLayoutMode: () => { },
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

/** Apply a CSS-variable map to :root */
function applyVars(map) {
  if (!map) return;
  const root = document.documentElement;
  Object.entries(map).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function ThemeProviderWrapper({ children }) {
  const [themeName, setThemeName] = useState(
    () => localStorage.getItem('filegeek-theme') || 'brutalist_dark'
  );
  const [font, setFontName] = useState(
    () => localStorage.getItem('filegeek-font') || 'jetbrains_mono'
  );
  const [density, setDensityName] = useState(
    () => localStorage.getItem('fg-density') || 'compact'
  );
  const [layoutMode, setLayoutModeName] = useState(
    () => localStorage.getItem('fg-layout') || 'analyst'
  );

  // Inject CSS variables whenever any setting changes
  useEffect(() => {
    applyVars(THEMES[themeName] || THEMES.brutalist_dark);
    applyVars(FONTS[font] || FONTS.jetbrains_mono);
    applyVars(DENSITY[density] || DENSITY.compact);
    // Expose layout mode as a data attribute for CSS selectors
    document.documentElement.setAttribute('data-layout', layoutMode);
  }, [themeName, font, density, layoutMode]);

  const setTheme = useCallback((name) => {
    if (!THEMES[name]) return;
    setThemeName(name);
    localStorage.setItem('filegeek-theme', name);
  }, []);

  const setFont = useCallback((name) => {
    if (!FONTS[name]) return;
    setFontName(name);
    localStorage.setItem('filegeek-font', name);
  }, []);

  const toggleDensity = useCallback(() => {
    setDensityName((prev) => {
      const next = prev === 'compact' ? 'spacious' : 'compact';
      localStorage.setItem('fg-density', next);
      return next;
    });
  }, []);

  const setLayoutMode = useCallback((mode) => {
    setLayoutModeName(mode);
    localStorage.setItem('fg-layout', mode);
  }, []);

  // Build a MUI theme using concrete hex values from the current theme map.
  // MUI's palette internals call lighten()/darken() which CANNOT parse CSS var() strings.
  // CSS variables are still injected on :root via applyVars() above; all plain CSS uses var(--accent) etc.
  const muiTheme = useMemo(() => {
    const t = THEMES[themeName] || THEMES.brutalist_dark;
    const isDark = ['brutalist_dark', 'cyber_amber'].includes(themeName);
    const fontFamily = (FONTS[font] || FONTS.jetbrains_mono)['--font-family'];
    return createTheme({
      palette: {
        mode: isDark ? 'dark' : 'light',
        primary: { main: t['--accent'] },
        background: { default: t['--bg-primary'], paper: t['--bg-secondary'] },
        text: { primary: t['--fg-primary'], secondary: t['--fg-secondary'] },
        divider: t['--border'],
        error: { main: t['--error'] },
        success: { main: t['--success'] },
        warning: { main: t['--warning'] },
      },
      typography: {
        // fontFamily is just a CSS string, not parsed by MUI color utils — safe to use directly
        fontFamily,
      },
      shape: { borderRadius: 2 },
      components: {
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
        MuiInputBase: { styleOverrides: { root: { fontFamily: 'var(--font-mono)' } } },
        MuiButton: { styleOverrides: { root: { textTransform: 'none' } } },
      },
    });
  }, [themeName, font]);


  const value = useMemo(() => ({
    themeName, font, density, layoutMode,
    setTheme, setFont, toggleDensity, setLayoutMode,
  }), [themeName, font, density, layoutMode, setTheme, setFont, toggleDensity, setLayoutMode]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
