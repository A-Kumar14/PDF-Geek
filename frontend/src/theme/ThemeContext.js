import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import createAcademicTheme from './academicTheme';

const ThemeContext = createContext({ mode: 'light', toggleMode: () => {} });

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function ThemeProviderWrapper({ children }) {
  const [mode, setMode] = useState(
    () => localStorage.getItem('filegeek-theme') || 'light'
  );

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('filegeek-theme', next);
      return next;
    });
  };

  const theme = useMemo(() => createAcademicTheme(mode), [mode]);

  // Sync 'dark' class to <html> for Tailwind dark: variants
  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
