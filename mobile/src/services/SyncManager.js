// src/services/SyncManager.js
// Automatic sync manager - coordinates offline storage, network monitoring, and data synchronization
import NetworkService from './NetworkService';
import OfflineStorageService from './OfflineStorageService';
import PaymentService from './PaymentService';
import api from './api';

class SyncManager {
  constructor() {
    this.syncInterval = null;
    this.isSyncing = false;
    this.syncListeners = [];
    this.autoSyncEnabled = true;
    this.syncIntervalMs = 10000; // 10 seconds when online
    this.lastSyncResult = null;
  }

  // ============================================================
  // INITIALIZE SYNC MANAGER
  // ============================================================
  async initialize() {
    console.log('🔄 Initializing Sync Manager...');

    // Initialize network monitoring
    NetworkService.initialize();

    // Listen for network state changes
    NetworkService.addListener(async (isOnline, wasOnline) => {
      if (isOnline && !wasOnline) {
        console.log('✅ Back online! Triggering sync...');
        await this.syncAll();
      } else if (!isOnline && wasOnline) {
        console.log('⚠️ Gone offline. Sync paused.');
        this.stopAutoSync();
      }
    });

    // Start auto-sync if online
    if (NetworkService.isConnected) {
      this.startAutoSync();
    }

    // Initial data fetch
    await this.syncAll();

    return this;
  }

  // ============================================================
  // START AUTO-SYNC (runs every X seconds when online)
  // ============================================================
  startAutoSync(intervalMs = this.syncIntervalMs) {
    if (this.syncInterval) {
      console.log('⚠️ Auto-sync already running');
      return;
    }

    this.syncIntervalMs = intervalMs;
    this.autoSyncEnabled = true;

    this.syncInterval = setInterval(async () => {
      if (NetworkService.isConnected && this.autoSyncEnabled) {
        await this.syncAll();
      }
    }, intervalMs);

    console.log(`✅ Auto-sync started (every ${intervalMs / 1000}s)`);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 Auto-sync stopped');
    }
  }

  // ============================================================
  // SYNC ALL DATA
  // ============================================================
  async syncAll() {
    if (this.isSyncing) {
      console.log('⚠️ Sync already in progress, skipping...');
      return this.lastSyncResult;
    }

    if (!NetworkService.isConnected) {
      console.log('⚠️ Offline - using cached data');
      return { success: false, offline: true };
    }

    this.isSyncing = true;
    const startTime = Date.now();

    console.log('🔄 Starting full sync...');

    try {
      const results = {
        routes: false,
        shuttles: false,
        offlineQueue: false,
        settings: false,
        timestamp: Date.now()
      };

      // 1. Sync offline payment queue FIRST (most important)
      try {
        const queueResult = await PaymentService.syncOfflineQueue();
        results.offlineQueue = queueResult.success;
        results.queueProcessed = queueResult.processed || 0;
        console.log(`✅ Offline queue: ${results.queueProcessed} transactions synced`);
      } catch (error) {
        console.error('❌ Offline queue sync failed:', error);
      }

      // 2. Fetch and cache routes
      try {
        const routesResponse = await api.get('/routes');
        if (routesResponse.data) {
          await OfflineStorageService.cacheRoutes(routesResponse.data);
          results.routes = true;
          console.log(`✅ Routes synced: ${routesResponse.data.length} routes`);
        }
      } catch (error) {
        console.error('❌ Routes sync failed:', error);
      }

      // 3. Fetch and cache shuttles
      try {
        const shuttlesResponse = await api.get('/shuttles/all');
        if (shuttlesResponse.data) {
          // Handle different response formats
          // API returns { shuttles: [...] } or just [...]
          let shuttlesArray = [];
          if (Array.isArray(shuttlesResponse.data)) {
            shuttlesArray = shuttlesResponse.data;
          } else if (shuttlesResponse.data.shuttles && Array.isArray(shuttlesResponse.data.shuttles)) {
            shuttlesArray = shuttlesResponse.data.shuttles;
          }

          await OfflineStorageService.cacheShuttles(shuttlesArray);
          results.shuttles = true;
          console.log(`✅ Shuttles synced: ${shuttlesArray.length} shuttles`);
        }
      } catch (error) {
        console.error('❌ Shuttles sync failed:', error);
      }

      // 4. Fetch and cache system settings
      try {
        const settingsResponse = await api.get('/system/config');
        if (settingsResponse.data) {
          await OfflineStorageService.cacheSettings(settingsResponse.data);
          results.settings = true;
          console.log('✅ Settings synced');
        }
      } catch (error) {
        console.error('❌ Settings sync failed:', error);
      }

      // Update last sync timestamp
      await OfflineStorageService.updateLastSyncTime();

      const duration = Date.now() - startTime;
      console.log(`✅ Full sync completed in ${duration}ms`);

      this.lastSyncResult = {
        success: true,
        results,
        duration,
        timestamp: Date.now()
      };

      // Notify listeners
      this.notifySyncListeners(this.lastSyncResult);

      return this.lastSyncResult;

    } catch (error) {
      console.error('❌ Sync failed:', error);

      this.lastSyncResult = {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };

      return this.lastSyncResult;

    } finally {
      this.isSyncing = false;
    }
  }

  // ============================================================
  // SYNC SPECIFIC DATA TYPES
  // ============================================================
  async syncRoutes() {
    if (!NetworkService.isConnected) return { success: false, offline: true };

    try {
      const response = await api.get('/routes');
      console.log('📡 Routes API response:', response.data);

      if (response.data) {
        // Ensure response.data is an array
        const routesArray = Array.isArray(response.data) ? response.data : [];
        await OfflineStorageService.cacheRoutes(routesArray);
        return { success: true, count: routesArray.length };
      }
      return { success: false };
    } catch (error) {
      console.error('❌ Routes sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  async syncShuttles() {
    if (!NetworkService.isConnected) return { success: false, offline: true };

    try {
      const response = await api.get('/shuttles/all');
      console.log('📡 Shuttles API response:', response.data);

      if (response.data) {
        // Handle different response formats
        // API returns { shuttles: [...] } or just [...]
        let shuttlesArray = [];
        if (Array.isArray(response.data)) {
          shuttlesArray = response.data;
        } else if (response.data.shuttles && Array.isArray(response.data.shuttles)) {
          shuttlesArray = response.data.shuttles;
        }

        console.log('🔍 Shuttles array extracted:', shuttlesArray.length, 'shuttles');
        await OfflineStorageService.cacheShuttles(shuttlesArray);
        return { success: true, count: shuttlesArray.length };
      }
      return { success: false };
    } catch (error) {
      console.error('❌ Shuttles sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  async syncOfflinePayments() {
    if (!NetworkService.isConnected) return { success: false, offline: true };

    try {
      const result = await PaymentService.syncOfflineQueue();
      return result;
    } catch (error) {
      console.error('❌ Offline payments sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================
  // GET CACHED DATA (falls back to API if online and no cache)
  // ============================================================
  async getRoutes() {
    // Try cache first
    let routes = await OfflineStorageService.getCachedRoutes();

    // If no cache and online, fetch from API
    if ((!routes || routes.length === 0) && NetworkService.isConnected) {
      const syncResult = await this.syncRoutes();
      if (syncResult.success) {
        routes = await OfflineStorageService.getCachedRoutes();
      }
    }

    return routes || [];
  }

  async getShuttles() {
    // Try cache first
    let shuttles = await OfflineStorageService.getCachedShuttles();

    // If no cache and online, fetch from API
    if ((!shuttles || shuttles.length === 0) && NetworkService.isConnected) {
      const syncResult = await this.syncShuttles();
      if (syncResult.success) {
        shuttles = await OfflineStorageService.getCachedShuttles();
      }
    }

    return shuttles || [];
  }

  async getSettings() {
    // Try cache first
    let settings = await OfflineStorageService.getCachedSettings();

    // If no cache and online, fetch from API
    if (!settings && NetworkService.isConnected) {
      try {
        const response = await api.get('/system/config');
        if (response.data) {
          await OfflineStorageService.cacheSettings(response.data);
          settings = response.data;
        }
      } catch (error) {
        console.error('❌ Failed to fetch settings:', error);
      }
    }

    return settings;
  }

  // ============================================================
  // SYNC STATUS & LISTENERS
  // ============================================================
  addSyncListener(callback) {
    if (typeof callback === 'function') {
      this.syncListeners.push(callback);
      console.log(`➕ Added sync listener (total: ${this.syncListeners.length})`);
    }
  }

  removeSyncListener(callback) {
    this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    console.log(`➖ Removed sync listener (total: ${this.syncListeners.length})`);
  }

  notifySyncListeners(result) {
    this.syncListeners.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('❌ Sync listener error:', error);
      }
    });
  }

  async getSyncStatus() {
    const queueCount = await PaymentService.getOfflineQueueCount();
    const lastSync = await OfflineStorageService.getTimeSinceLastSync();

    return {
      isOnline: NetworkService.isConnected,
      isSyncing: this.isSyncing,
      autoSyncEnabled: this.autoSyncEnabled,
      offlineQueueCount: queueCount,
      lastSync: lastSync || 'Never',
      lastSyncResult: this.lastSyncResult
    };
  }

  // ============================================================
  // CLEANUP
  // ============================================================
  cleanup() {
    this.stopAutoSync();
    NetworkService.cleanup();
    this.syncListeners = [];
    console.log('🧹 Sync manager cleaned up');
  }
}

// Create singleton instance
const syncManager = new SyncManager();

export default syncManager;
