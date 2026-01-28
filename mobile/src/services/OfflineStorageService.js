// src/services/OfflineStorageService.js
// Enhanced offline storage service with automatic data caching and sync
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ROUTES: 'cached_routes',
  SHUTTLES: 'cached_shuttles',
  USER_SESSION: 'user_session',
  OFFLINE_QUEUE: 'offlineQueue',
  LAST_SYNC: 'last_sync_timestamp',
  SHUTTLE_POSITIONS: 'cached_shuttle_positions',
  TRIP_DATA: 'active_trip_data',
  MERCHANT_DATA: 'merchant_session_data',
  SETTINGS: 'system_settings'
};

const OfflineStorageService = {
  // ============================================================
  // ROUTES CACHING
  // ============================================================
  async cacheRoutes(routes) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify({
        data: routes,
        timestamp: Date.now()
      }));
      console.log('✅ Cached', routes.length, 'routes');
    } catch (error) {
      console.error('❌ Failed to cache routes:', error);
    }
  },

  async getCachedRoutes() {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.ROUTES);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        console.log('📦 Retrieved', data.length, 'cached routes from', new Date(timestamp).toLocaleString());
        return data;
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to get cached routes:', error);
      return [];
    }
  },

  // ============================================================
  // SHUTTLES CACHING
  // ============================================================
  async cacheShuttles(shuttles) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SHUTTLES, JSON.stringify({
        data: shuttles,
        timestamp: Date.now()
      }));
      console.log('✅ Cached', shuttles.length, 'shuttles');
    } catch (error) {
      console.error('❌ Failed to cache shuttles:', error);
    }
  },

  async getCachedShuttles() {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.SHUTTLES);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        console.log('📦 Retrieved', data.length, 'cached shuttles from', new Date(timestamp).toLocaleString());
        return data;
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to get cached shuttles:', error);
      return [];
    }
  },

  // ============================================================
  // USER SESSION MANAGEMENT
  // ============================================================
  async saveUserSession(userData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify({
        ...userData,
        savedAt: Date.now()
      }));
      console.log('✅ User session saved');
    } catch (error) {
      console.error('❌ Failed to save user session:', error);
    }
  },

  async getUserSession() {
    try {
      const session = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
      if (session) {
        return JSON.parse(session);
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get user session:', error);
      return null;
    }
  },

  async clearUserSession() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      console.log('🗑️ User session cleared');
    } catch (error) {
      console.error('❌ Failed to clear user session:', error);
    }
  },

  // ============================================================
  // TRIP DATA PERSISTENCE (for driver sessions)
  // ============================================================
  async saveTripData(tripData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRIP_DATA, JSON.stringify({
        ...tripData,
        savedAt: Date.now()
      }));
      console.log('✅ Trip data saved');
    } catch (error) {
      console.error('❌ Failed to save trip data:', error);
    }
  },

  async getTripData() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRIP_DATA);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get trip data:', error);
      return null;
    }
  },

  async clearTripData() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TRIP_DATA);
      console.log('🗑️ Trip data cleared');
    } catch (error) {
      console.error('❌ Failed to clear trip data:', error);
    }
  },

  // ============================================================
  // MERCHANT SESSION DATA
  // ============================================================
  async saveMerchantData(merchantData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MERCHANT_DATA, JSON.stringify({
        ...merchantData,
        savedAt: Date.now()
      }));
      console.log('✅ Merchant data saved');
    } catch (error) {
      console.error('❌ Failed to save merchant data:', error);
    }
  },

  async getMerchantData() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MERCHANT_DATA);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get merchant data:', error);
      return null;
    }
  },

  // ============================================================
  // SYSTEM SETTINGS CACHE
  // ============================================================
  async cacheSettings(settings) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
        data: settings,
        timestamp: Date.now()
      }));
      console.log('✅ Settings cached');
    } catch (error) {
      console.error('❌ Failed to cache settings:', error);
    }
  },

  async getCachedSettings() {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (cached) {
        const { data } = JSON.parse(cached);
        return data;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get cached settings:', error);
      return null;
    }
  },

  // ============================================================
  // SHUTTLE POSITIONS CACHE (for offline map viewing)
  // ============================================================
  async cacheShuttlePositions(positions) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SHUTTLE_POSITIONS, JSON.stringify({
        data: positions,
        timestamp: Date.now()
      }));
      console.log('✅ Cached shuttle positions');
    } catch (error) {
      console.error('❌ Failed to cache shuttle positions:', error);
    }
  },

  async getCachedShuttlePositions() {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.SHUTTLE_POSITIONS);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        console.log('📦 Retrieved cached shuttle positions from', new Date(timestamp).toLocaleString());
        return data;
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to get cached shuttle positions:', error);
      return [];
    }
  },

  // ============================================================
  // SYNC TIMESTAMP TRACKING
  // ============================================================
  async updateLastSyncTime() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      console.error('❌ Failed to update last sync time:', error);
    }
  },

  async getLastSyncTime() {
    try {
      const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (timestamp) {
        return parseInt(timestamp, 10);
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get last sync time:', error);
      return null;
    }
  },

  async getTimeSinceLastSync() {
    const lastSync = await this.getLastSyncTime();
    if (!lastSync) return null;

    const secondsAgo = Math.floor((Date.now() - lastSync) / 1000);

    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  },

  // ============================================================
  // CLEAR ALL CACHE (useful for logout)
  // ============================================================
  async clearAllCache() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ROUTES,
        STORAGE_KEYS.SHUTTLES,
        STORAGE_KEYS.USER_SESSION,
        STORAGE_KEYS.SHUTTLE_POSITIONS,
        STORAGE_KEYS.TRIP_DATA,
        STORAGE_KEYS.MERCHANT_DATA,
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.LAST_SYNC
      ]);
      console.log('🗑️ All cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear all cache:', error);
    }
  },

  // ============================================================
  // GET STORAGE STATISTICS
  // ============================================================
  async getStorageStats() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);

      let totalSize = 0;
      const stats = {};

      items.forEach(([key, value]) => {
        const size = new Blob([value]).size;
        totalSize += size;
        stats[key] = {
          size: size,
          sizeKB: (size / 1024).toFixed(2)
        };
      });

      return {
        totalKeys: keys.length,
        totalSize: totalSize,
        totalSizeKB: (totalSize / 1024).toFixed(2),
        items: stats
      };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return null;
    }
  }
};

export default OfflineStorageService;
