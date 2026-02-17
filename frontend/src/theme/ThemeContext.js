import React, { createContext, useMemo, useContext } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import createAcademicTheme from './academicTheme';

const ThemeContext = createContext({ mode: 'dark', toggleMode: () => {} });

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function ThemeProviderWrapper({ children }) {
  const mode = 'dark';
  const toggleMode = () => {}; // No-op: brutalist theme is dark-only

  const theme = useMemo(() => createAcademicTheme(), []);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
