// Shared theme constants for NUCash Mobile App
// This ensures consistency across all User screens and components

export const COLORS = {
  // Primary Colors
  primary: '#FFD41C',        // Gold - Primary actions and highlights
  darkNavy: '#181D40',       // Dark Navy - Main backgrounds
  darkGray: '#1E1E1E',       // Dark Gray - Cards and modals
  purpleBlue: '#35408E',     // Purple Blue - Borders and secondary elements
  offWhite: '#FBFBFB',       // Off White - Primary text and icons

  // Status Colors
  success: '#10B981',        // Green - Success states, active items
  warning: '#F59E0B',        // Amber - Warnings, caution states
  error: '#EF4444',          // Red - Error states, danger
  info: '#3B82F6',           // Blue - Info states

  // Text Colors
  text: {
    primary: '#FBFBFB',      // Primary text
    secondary: 'rgba(251, 251, 251, 0.7)',  // Secondary text
    tertiary: 'rgba(251, 251, 251, 0.5)',   // Tertiary text
    muted: 'rgba(251, 251, 251, 0.4)',      // Muted text
  },

  // Background Colors
  background: {
    primary: '#181D40',
    secondary: '#1E1E1E',
    card: '#1E1E1E',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Border Colors
  border: {
    primary: '#35408E',
    secondary: 'rgba(53, 64, 142, 0.5)',
    light: 'rgba(251, 251, 251, 0.1)',
  },
};

export const TYPOGRAPHY = {
  // Font Sizes
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    display: 40,
    hero: 65,
  },

  // Font Weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const SPACING = {
  // Padding & Margin
  xs: 4,
  sm: 8,
  md: 12,
  base: 15,
  lg: 20,
  xl: 30,
  xxl: 40,

  // Border Radius
  radius: {
    sm: 8,
    md: 12,
    lg: 15,
    xl: 20,
    full: 999,
  },

  // Gaps
  gap: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const ANIMATIONS = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

// Common component styles
export const COMMON_STYLES = {
  container: {
    flex: 1,
    backgroundColor: COLORS.darkNavy,
  },

  card: {
    backgroundColor: COLORS.background.card,
    borderRadius: SPACING.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    padding: SPACING.base,
  },

  button: {
    primary: {
      backgroundColor: COLORS.primary,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: SPACING.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },

    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: COLORS.primary,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: SPACING.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
  },

  text: {
    heading: {
      fontSize: TYPOGRAPHY.fontSize.xxl,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      color: COLORS.text.primary,
    },

    subheading: {
      fontSize: TYPOGRAPHY.fontSize.lg,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      color: COLORS.text.primary,
    },

    body: {
      fontSize: TYPOGRAPHY.fontSize.base,
      fontWeight: TYPOGRAPHY.fontWeight.regular,
      color: COLORS.text.primary,
    },

    caption: {
      fontSize: TYPOGRAPHY.fontSize.sm,
      fontWeight: TYPOGRAPHY.fontWeight.regular,
      color: COLORS.text.secondary,
    },
  },

  input: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.secondary,
    borderRadius: SPACING.radius.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text.primary,
  },

  header: {
    backgroundColor: COLORS.darkNavy,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
  ANIMATIONS,
  COMMON_STYLES,
};
