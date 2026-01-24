import React, { createContext, useContext, useState, useMemo } from 'react';

const lightTheme = {
  mode: 'light',
  background: '#f5f5f5',
  surface: '#ffffff',
  headerBg: '#2196f3',
  headerText: '#ffffff',
  textPrimary: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#e0e0e0',
  overlay: 'rgba(0,0,0,0.5)',
  filtroBg: '#f0f0f0',
  filtroActiveBg: '#2196F3',
  cardShadow: '#000',
};

const darkTheme = {
  mode: 'dark',
  background: '#121212',
  surface: '#1e1e1e',
  headerBg: '#121212',
  headerText: '#ffffff',
  textPrimary: '#e0e0e0',
  textSecondary: '#bbbbbb',
  textMuted: '#888888',
  border: '#2a2a2a',
  overlay: 'rgba(0,0,0,0.6)',
  filtroBg: '#2a2a2a',
  filtroActiveBg: '#2196F3',
  cardShadow: '#000',
};

const ThemeContext = createContext({ mode: 'light', theme: lightTheme, toggleTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  const toggleTheme = () => setMode(m => (m === 'light' ? 'dark' : 'light'));

  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
