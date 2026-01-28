// src/services/LocationService.js
// FIXED: Singleton pattern to prevent multiple location watchers

import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';
import api from './api';

// Haversine helper
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = v => (v * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const LocationService = {
  watchId: null,
  geofences: [],
  isInitialized: false,
  isWatching: false, // NEW: Track if already watching
  currentCallback: null, // NEW: Store callback

  async init() {
    if (this.isInitialized) {
      console.log('✅ LocationService already initialized');
      return true;
    }

    try {
      // Check and request permissions
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'NUCash needs access to your location for route tracking',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('⚠️ Location permission denied');
          return false;
        }
      } else if (Platform.OS === 'ios') {
        // For iOS, request authorization
        await Geolocation.requestAuthorization('whenInUse');
      }

      this.isInitialized = true;
      console.log('✅ LocationService initialized');
      return true;
    } catch (error) {
      console.error('❌ LocationService init error:', error);
      return false;
    }
  },

  async loadGeofences() {
    try {
      const res = await api.get('/geofences');
      this.geofences = res.data;
      console.log('✅ Geofences loaded:', this.geofences.length);
    } catch (e) {
      console.warn('⚠️ Failed to load geofences:', e.message);
    }
  },

  async startWatching(onLocation) {
    // CRITICAL FIX: Prevent duplicate watchers
    if (this.isWatching) {
      console.log('⚠️ Location already being watched, updating callback only');
      this.currentCallback = onLocation;
      return this.watchId;
    }

    if (!this.isInitialized) {
      console.warn('⚠️ LocationService not initialized, initializing now...');
      const initialized = await this.init();
      if (!initialized) {
        console.error('❌ Failed to initialize LocationService');
        return null;
      }
    }

    try {
      console.log('🚀 Starting location watch...');
      this.currentCallback = onLocation;
      this.isWatching = true;
      
      this.watchId = Geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log('📍 Location update:', latitude.toFixed(6), longitude.toFixed(6));
          
          // Send latest position to server
          try {
            await api.post('/shuttle/updateLocation', {
              shuttleId: 'SHUTTLE_01', 
              latitude, 
              longitude, 
              timestamp: new Date().toISOString()
            });
          } catch (e) {
            // Ignore network errors silently
          }

          // Check geofences on device
          for (const g of this.geofences) {
            const d = haversineDistance(latitude, longitude, g.latitude, g.longitude);
            if (d <= (g.radius || 100)) {
              try {
                await api.post('/shuttle/geofenceEvent', { 
                  shuttleId: 'SHUTTLE_01', 
                  geofenceId: g.locationId, 
                  timestamp: new Date().toISOString() 
                });
              } catch (e) { /* ignore */ }
            }
          }

          // Call the callback if provided
          if (this.currentCallback) {
            this.currentCallback(pos.coords);
          }
        },
        (err) => {
          console.warn('⚠️ Location error:', err.code, err.message);
        },
        { 
          enableHighAccuracy: true, 
          distanceFilter: 5, 
          interval: 5000, 
          fastestInterval: 3000,
          showLocationDialog: true,
          forceRequestLocation: true,
        }
      );

      console.log('✅ Location watch started, ID:', this.watchId);
      return this.watchId;
    } catch (error) {
      console.error('❌ Failed to start watching:', error);
      this.isWatching = false;
      return null;
    }
  },

  stopWatching() {
    if (this.watchId !== null) {
      try {
        Geolocation.clearWatch(this.watchId);
        console.log('🛑 Location watch stopped');
        this.watchId = null;
        this.isWatching = false;
        this.currentCallback = null;
      } catch (error) {
        console.error('❌ Error stopping watch:', error);
      }
    } else {
      console.log('ℹ️ No active watch to stop');
    }
  },

  // NEW: Check if currently watching
  isCurrentlyWatching() {
    return this.isWatching && this.watchId !== null;
  }
};

export default LocationService;