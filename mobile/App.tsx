// App.tsx
// UPDATED: Added RouteProvider for shared passenger tracking
// UPDATED AGAIN: Added SafeAreaProvider for iOS Dynamic Island & Android status bar handling

import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import NFCService from './src/services/NFCService';
import BackgroundSync from './src/services/BackgroundSync';
import SyncManager from './src/services/SyncManager';
import { RouteProvider } from './src/context/RouteContext';

// ✅ NEW IMPORT
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize NFC
        const nfcReady = await NFCService.init();
        console.log('NFC initialized:', nfcReady);

        // Initialize SyncManager (handles offline storage and auto-sync)
        await SyncManager.initialize();
        console.log('✅ SyncManager initialized with auto-sync');

        // Configure background sync
        BackgroundSync.configure();
        console.log('Background sync configured');

        // ❌ DON'T START LOCATION SERVICE HERE - it crashes!
        // LocationService will be started in RouteTrackingScreen when needed

      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    init();

    // Cleanup on app unmount
    return () => {
      SyncManager.cleanup();
    };
  }, []);

  return (
    // ✅ SAFE AREA PROVIDER ADDED (Top-level wrapper)
    <SafeAreaProvider>

      <RouteProvider>
        <AppNavigator />
      </RouteProvider>

    </SafeAreaProvider>
  );
}
