// Shared theme constants for NUCash Admin Dashboards
// Used by both Motorpool Admin and Merchant Admin
// Ensures consistent UI across all admin interfaces

export const COLORS = {
  // Primary Brand Colors
  primary: '#FFD41C',        // NUCash Yellow/Gold
  primaryDark: '#E5BF19',    // Darker shade for hover states

  // Background Colors - Dark Theme
  dark: {
    primary: '#0F1227',      // Darkest - Main background
    secondary: '#181D40',    // Medium dark - Cards and containers
    tertiary: '#1E2347',     // Lighter dark - UI elements
    card: 'rgba(255, 255, 255, 0.03)', // Card background with transparency
  },

  // Background Colors - Light Theme
  light: {
    primary: '#F0F7FF',      // Light blue-white background
    secondary: '#FFFFFF',    // Pure white for cards
    card: '#FFFFFF',         // Card background
  },

  // Text Colors - Dark Theme
  textDark: {
    primary: 'rgba(251, 251, 251, 0.95)',
    secondary: 'rgba(251, 251, 251, 0.6)',
    tertiary: 'rgba(251, 251, 251, 0.5)',
    muted: 'rgba(251, 251, 251, 0.4)',
  },

  // Text Colors - Light Theme
  textLight: {
    primary: 'rgba(24, 29, 64, 0.95)',
    secondary: 'rgba(24, 29, 64, 0.75)',
    tertiary: 'rgba(24, 29, 64, 0.6)',
    muted: 'rgba(24, 29, 64, 0.5)',
  },

  // Status Colors (Universal)
  status: {
    success: '#22C55E',      // Green - Success, completed, active
    error: '#EF4444',        // Red - Error, failed, inactive
    warning: '#FBBF24',      // Amber - Warning, pending
    info: '#3B82F6',         // Blue - Info, in progress
  },

  // Priority Colors
  priority: {
    low: '#22C55E',          // Green
    medium: '#FBBF24',       // Yellow
    high: '#F97316',         // Orange
    urgent: '#EF4444',       // Red
  },

  // Border Colors - Dark Theme
  borderDark: {
    primary: 'rgba(255, 212, 28, 0.2)',
    hover: 'rgba(255, 212, 28, 0.3)',
    focus: 'rgba(255, 212, 28, 0.5)',
    light: 'rgba(251, 251, 251, 0.1)',
  },

  // Border Colors - Light Theme
  borderLight: {
    primary: 'rgba(59, 130, 246, 0.3)',
    hover: 'rgba(59, 130, 246, 0.5)',
    focus: 'rgba(59, 130, 246, 0.7)',
    light: 'rgba(24, 29, 64, 0.1)',
  },

  // Overlay Colors
  overlay: {
    dark: 'rgba(0, 0, 0, 0.7)',
    light: 'rgba(0, 0, 0, 0.3)',
  },
};

export const TYPOGRAPHY = {
  // Font Families
  fontFamily: {
    display: "'Playfair Display', serif",
    body: "'Inter', sans-serif",
  },

  // Font Sizes (in pixels)
  fontSize: {
    xs: '11px',
    sm: '13px',
    base: '15px',
    lg: '17px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
    '4xl': '32px',
    '5xl': '40px',
  },

  // Font Weights
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const SPACING = {
  // Base spacing units (in pixels)
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '48px',

  // Border Radius
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    full: '9999px',
  },

  // Container Padding
  container: {
    sm: '12px',
    md: '20px',
    lg: '30px',
  },
};

export const SHADOWS = {
  // Box shadows for different elevation levels
  sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
  md: '0 4px 8px rgba(0, 0, 0, 0.15)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
  xl: '0 12px 24px rgba(0, 0, 0, 0.25)',
  '2xl': '0 20px 40px rgba(0, 0, 0, 0.3)',

  // Glow effects
  glow: {
    primary: '0 0 20px rgba(255, 212, 28, 0.3)',
    success: '0 0 20px rgba(34, 197, 94, 0.3)',
    error: '0 0 20px rgba(239, 68, 68, 0.3)',
  },
};

export const TRANSITIONS = {
  // Transition durations
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },

  // Easing functions
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export const BREAKPOINTS = {
  // Responsive breakpoints
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultrawide: '1536px',
};

export const Z_INDEX = {
  // Z-index layering
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// Pagination Constants
export const PAGINATION = {
  itemsPerPage: 20,
  defaultPage: 1,
};

// Refresh Intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  dashboard: 2000,     // 2 seconds for dashboard stats
  liveTracking: 2000,  // 2 seconds for shuttle positions
  list: 5000,          // 5 seconds for list pages
  slow: 10000,         // 10 seconds for less critical data
};

// Common Component Styles
export const COMMON_STYLES = {
  // Card styles
  card: (isDarkMode) => ({
    background: isDarkMode ? COLORS.dark.secondary : COLORS.light.card,
    borderRadius: SPACING.radius.lg,
    border: `1px solid ${isDarkMode ? COLORS.borderDark.primary : COLORS.borderLight.primary}`,
    padding: SPACING.lg,
    transition: `all ${TRANSITIONS.duration.normal} ${TRANSITIONS.easing.easeOut}`,
  }),

  // Button styles
  button: {
    primary: (isDarkMode) => ({
      background: COLORS.primary,
      color: isDarkMode ? COLORS.dark.primary : COLORS.light.primary,
      padding: `${SPACING.md} ${SPACING.xl}`,
      borderRadius: SPACING.radius.md,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      border: 'none',
      cursor: 'pointer',
      transition: `all ${TRANSITIONS.duration.normal} ${TRANSITIONS.easing.easeOut}`,
    }),

    secondary: (isDarkMode) => ({
      background: 'transparent',
      color: isDarkMode ? COLORS.textDark.primary : COLORS.textLight.primary,
      padding: `${SPACING.md} ${SPACING.xl}`,
      borderRadius: SPACING.radius.md,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      border: `1px solid ${isDarkMode ? COLORS.borderDark.primary : COLORS.borderLight.primary}`,
      cursor: 'pointer',
      transition: `all ${TRANSITIONS.duration.normal} ${TRANSITIONS.easing.easeOut}`,
    }),

    danger: {
      background: COLORS.status.error,
      color: COLORS.textDark.primary,
      padding: `${SPACING.md} ${SPACING.xl}`,
      borderRadius: SPACING.radius.md,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      border: 'none',
      cursor: 'pointer',
      transition: `all ${TRANSITIONS.duration.normal} ${TRANSITIONS.easing.easeOut}`,
    },
  },

  // Input styles
  input: (isDarkMode) => ({
    background: isDarkMode ? COLORS.dark.tertiary : COLORS.light.secondary,
    color: isDarkMode ? COLORS.textDark.primary : COLORS.textLight.primary,
    border: `1px solid ${isDarkMode ? COLORS.borderDark.light : COLORS.borderLight.light}`,
    borderRadius: SPACING.radius.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    transition: `all ${TRANSITIONS.duration.fast} ${TRANSITIONS.easing.easeOut}`,
  }),

  // Modal styles
  modal: (isDarkMode) => ({
    background: isDarkMode ? COLORS.dark.secondary : COLORS.light.secondary,
    borderRadius: SPACING.radius.xl,
    border: `1px solid ${isDarkMode ? COLORS.borderDark.primary : COLORS.borderLight.primary}`,
    boxShadow: SHADOWS.xl,
    maxWidth: '600px',
    width: '100%',
    maxHeight: '85vh',
    overflow: 'auto',
  }),

  // Badge styles
  badge: (type, isDarkMode) => {
    const colors = {
      success: COLORS.status.success,
      error: COLORS.status.error,
      warning: COLORS.status.warning,
      info: COLORS.status.info,
    };

    return {
      background: `${colors[type] || COLORS.status.info}20`,
      color: colors[type] || COLORS.status.info,
      padding: `${SPACING.xs} ${SPACING.md}`,
      borderRadius: SPACING.radius.full,
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      display: 'inline-block',
    };
  },

  // Table styles
  table: (isDarkMode) => ({
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: isDarkMode ? COLORS.textDark.primary : COLORS.textLight.primary,
  }),
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
  TRANSITIONS,
  BREAKPOINTS,
  Z_INDEX,
  PAGINATION,
  REFRESH_INTERVALS,
  COMMON_STYLES,
};
