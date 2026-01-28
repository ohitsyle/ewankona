// src/context/ThemeContext.jsx
// Theme context for managing light/dark mode across the application

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('nucash-theme');
    return savedTheme === 'dark' || savedTheme === null; // Default to dark
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('nucash-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Theme colors
  const theme = isDarkMode ? {
    // Dark Mode Colors
    mode: 'dark',
    bg: {
      primary: 'linear-gradient(135deg, #0F1227 0%, #181D40 100%)',
      secondary: 'rgba(30,35,71,0.5)',
      tertiary: 'rgba(255,255,255,0.05)',
      card: 'rgba(255,255,255,0.03)',
      hover: 'rgba(255,255,255,0.06)'
    },
    text: {
      primary: 'rgba(251,251,251,0.95)',
      secondary: 'rgba(251,251,251,0.6)',
      tertiary: 'rgba(251,251,251,0.5)',
      muted: 'rgba(251,251,251,0.4)'
    },
    border: {
      primary: 'rgba(255,212,28,0.2)',
      secondary: 'rgba(255,212,28,0.15)',
      hover: 'rgba(255,212,28,0.3)'
    },
    accent: {
      primary: '#FFD41C',
      secondary: '#181D40'
    },
    scrollbar: {
      track: 'rgba(255,212,28,0.05)',
      thumb: 'rgba(255,212,28,0.3)',
      thumbHover: 'rgba(255,212,28,0.5)'
    }
  } : {
    // Light Mode Colors
    mode: 'light',
    bg: {
      primary: 'linear-gradient(135deg, #E8F1FF 0%, #F0F7FF 100%)',  // Light blue background
      secondary: '#FFFFFF',  // White for headers, footer, tab cards
      tertiary: 'rgba(59,130,246,0.05)',
      card: '#FFFFFF',  // White cards
      hover: 'rgba(59,130,246,0.15)'
    },
    text: {
      primary: 'rgba(24,29,64,0.95)',
      secondary: 'rgba(24,29,64,0.75)',
      tertiary: 'rgba(24,29,64,0.65)',
      muted: 'rgba(24,29,64,0.5)'
    },
    border: {
      primary: 'rgba(59,130,246,0.3)',
      secondary: 'rgba(59,130,246,0.15)',
      hover: 'rgba(59,130,246,0.5)'
    },
    accent: {
      primary: '#3B82F6',  // Blue accent (replaces yellow in light mode)
      secondary: '#FFFFFF'  // White text on blue
    },
    scrollbar: {
      track: 'rgba(59,130,246,0.08)',
      thumb: 'rgba(59,130,246,0.3)',
      thumbHover: 'rgba(59,130,246,0.5)'
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
