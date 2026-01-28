// Pagination constants for consistent pagination across all admin dashboards
// Motorpool Admin and Merchant Admin

export const PAGINATION_CONFIG = {
  // Items per page for all list views
  ITEMS_PER_PAGE: 20,

  // Default starting page
  DEFAULT_PAGE: 1,

  // Max items to load for client-side filtering
  MAX_ITEMS_CLIENT_SIDE: 1000,

  // Page range display (how many page numbers to show at once)
  PAGE_RANGE_DISPLAYED: 5,
};

export const REFRESH_INTERVALS = {
  // Dashboard and live tracking - 2 seconds
  DASHBOARD: 2000,
  LIVE_TRACKING: 2000,
  SHUTTLE_POSITIONS: 2000,

  // List pages - 5 seconds
  ROUTES: 5000,
  DRIVERS: 5000,
  SHUTTLES: 5000,
  TRIPS: 5000,
  CONCERNS: 5000,
  TRANSACTIONS: 5000,
  MERCHANTS: 5000,
  LOGS: 5000,

  // Slower refresh for less critical data - 10 seconds
  CONFIGURATIONS: 10000,
  ANALYTICS: 10000,
};

export default {
  PAGINATION_CONFIG,
  REFRESH_INTERVALS,
};
