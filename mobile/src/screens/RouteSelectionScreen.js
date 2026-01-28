// src/screens/RouteSelectionScreen.js
// FIXED: Added auto-refresh every 5 seconds to sync with admin dashboard
// Also respects isActive flag for routes

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  AppState
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import SyncManager from '../services/SyncManager';
import NetworkService from '../services/NetworkService';

const AUTO_REFRESH_INTERVAL = 5000; // 5 seconds - FIXED: Was 2000ms, now matches comment and UI message

export default function RouteSelectionScreen({ navigation, route }) {
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  const refreshIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const driverName = route.params?.name || 'Driver';
  const driverId = route.params?.driverId || '';
  const shuttleId = route.params?.shuttleId || 'SHUTTLE_01';
  const vehicleInfo = route.params?.vehicleInfo || '';

  // Fetch routes from SyncManager (uses cache when offline)
  const fetchRoutes = async (showLoading = false) => {
    if (showLoading) setLoading(true);

    try {
      console.log('🗺️ Fetching routes...');

      // Use SyncManager to get routes (automatically uses cache when offline)
      const routes = await SyncManager.getRoutes();

      // Safety check: ensure routes is an array
      if (!routes || !Array.isArray(routes)) {
        console.warn('⚠️ Routes data is invalid:', routes);
        setAvailableRoutes([]);
        setIsOnline(NetworkService.isConnected);
        return;
      }

      // Filter only active routes
      const activeRoutes = routes.filter(r => r.isActive !== false);

      setAvailableRoutes(activeRoutes);
      setLastUpdated(new Date());
      setIsOnline(NetworkService.isConnected);

      // If selected route is no longer available, clear selection
      if (selectedRoute) {
        const stillExists = activeRoutes.find(r => r.routeId === selectedRoute.routeId);
        if (!stillExists) {
          setSelectedRoute(null);
        }
      }

      console.log('✅ Routes loaded:', activeRoutes.length, 'active routes', isOnline ? '(online)' : '(offline)');
    } catch (error) {
      console.error('❌ Failed to load routes:', error);
      if (showLoading) {
        Alert.alert('Error', 'Could not load routes. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Start auto-refresh interval
  const startAutoRefresh = () => {
    stopAutoRefresh();
    refreshIntervalRef.current = setInterval(() => {
      fetchRoutes(false);
    }, AUTO_REFRESH_INTERVAL);
    console.log('🔄 Route auto-refresh started');
  };

  // Stop auto-refresh interval
  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
      console.log('⏹️ Route auto-refresh stopped');
    }
  };

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App came to foreground');
        fetchRoutes(false);
        startAutoRefresh();
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('📱 App going to background');
        stopAutoRefresh();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Start/stop refresh when screen gains/loses focus
  useFocusEffect(
    useCallback(() => {
      console.log('👁️ RouteSelection focused');
      fetchRoutes(true);
      startAutoRefresh();

      return () => {
        console.log('👁️ RouteSelection unfocused');
        stopAutoRefresh();
      };
    }, [])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoRefresh();
    };
  }, []);

  // Pull-to-refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    fetchRoutes(false);
  };

  const handleSelectRoute = (routeItem) => {
    setSelectedRoute(routeItem);
  };

  const handleConfirm = () => {
    if (!selectedRoute) {
      Alert.alert('Select Route', 'Please select a route to continue');
      return;
    }

    // Re-check route availability
    const currentRoute = availableRoutes.find(r => r.routeId === selectedRoute.routeId);
    if (!currentRoute) {
      Alert.alert(
        'Route No Longer Available',
        'This route was deactivated. Please select a different route.',
        [{ text: 'OK' }]
      );
      setSelectedRoute(null);
      fetchRoutes(false);
      return;
    }

    console.log('✅ Route confirmed:', selectedRoute.routeName);
    stopAutoRefresh();

    // Navigate to PaymentScreen with route data
    navigation.replace('Payment', {
      name: driverName,
      driverId: driverId,
      shuttleId: shuttleId,
      vehicleInfo: vehicleInfo,
      selectedRoute: {
        id: selectedRoute.routeId,
        routeId: selectedRoute.routeId,
        name: selectedRoute.routeName,
        from: {
          name: selectedRoute.fromName,
          latitude: selectedRoute.fromLatitude,
          longitude: selectedRoute.fromLongitude
        },
        destination: {
          name: selectedRoute.toName,
          latitude: selectedRoute.toLatitude,
          longitude: selectedRoute.toLongitude
        },
        fare: selectedRoute.fare
      }
    });
  };

  const handleBack = () => {
    Alert.alert(
      'Go Back?',
      'Return to shuttle selection? Your shuttle will be released.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go Back',
          style: 'destructive',
          onPress: async () => {
            stopAutoRefresh();
            // Release the shuttle
            try {
              await api.post('/shuttles/release', {
                shuttleId: shuttleId,
                driverId: driverId
              });
              console.log('✅ Shuttle released');
            } catch (e) {
              console.warn('Release failed:', e.message);
            }
            navigation.replace('ShuttleSelection', {
              driverId: driverId,
              name: driverName
            });
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD41C" />
            <Text style={styles.loadingText}>Loading routes...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.driverName}>{driverName}</Text>
          </View>
          <TouchableOpacity onPress={handleBack} style={styles.logoutBtn}>
            <View style={styles.iconWrapper}>
              <Text style={styles.logoutIcon}>←</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Driver Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.shuttleIcon}>
            <Text style={styles.shuttleEmoji}>🚐</Text>
          </View>
          <View style={styles.infoDetails}>
            <Text style={styles.infoLabel}>Shuttle</Text>
            <Text style={styles.infoValue}>{shuttleId}</Text>
            {vehicleInfo && <Text style={styles.infoSubValue}>{vehicleInfo}</Text>}
          </View>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>Step 2 of 2</Text>
          </View>
        </View>

        {/* Title with Live Indicator */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Select Your Route</Text>
          <View style={[styles.liveIndicator, !isOnline && styles.offlineIndicator]}>
            <View style={[styles.liveDot, !isOnline && styles.offlineDot]} />
            <Text style={[styles.liveText, !isOnline && styles.offlineText]}>
              {isOnline ? 'LIVE' : 'OFFLINE'}
            </Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {isOnline ? 'Choose your destination for this trip' : 'Using cached data - will sync when online'}
        </Text>

        {/* Routes List with Pull-to-Refresh */}
        <ScrollView 
          style={styles.routesList} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFD41C"
              colors={['#FFD41C']}
            />
          }
        >
          {availableRoutes.map((routeItem) => (
            <TouchableOpacity
              key={routeItem.routeId}
              style={[
                styles.routeCard,
                selectedRoute?.routeId === routeItem.routeId && styles.routeCardSelected
              ]}
              onPress={() => handleSelectRoute(routeItem)}
              activeOpacity={0.7}
            >
              <View style={styles.routeCardHeader}>
                {selectedRoute?.routeId === routeItem.routeId && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>✓ Selected</Text>
                  </View>
                )}
              </View>

              <Text style={styles.routeName}>
                {routeItem.routeName}
              </Text>

              <View style={styles.routeDetailsGrid}>
                <View style={styles.routeDetailItem}>
                  <Text style={styles.routeDetailIcon}>📍</Text>
                  <View style={styles.routeDetailText}>
                    <Text style={styles.routeDetailLabel}>From</Text>
                    <Text style={styles.routeDetailValue}>
                      {routeItem.fromName}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeDetailItem}>
                  <Text style={styles.routeDetailIcon}>🎯</Text>
                  <View style={styles.routeDetailText}>
                    <Text style={styles.routeDetailLabel}>To</Text>
                    <Text style={styles.routeDetailValue}>
                      {routeItem.toName}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeDetailItem}>
                  <Text style={styles.routeDetailIcon}>💰</Text>
                  <View style={styles.routeDetailText}>
                    <Text style={styles.routeDetailLabel}>Fare</Text>
                    <Text style={styles.routeDetailValue}>
                      ₱{routeItem.fare?.toFixed(2) || '15.00'}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {availableRoutes.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🗺️</Text>
              <Text style={styles.emptyText}>No routes available</Text>
              <Text style={styles.emptySubtext}>
                Please contact admin to add routes
              </Text>
            </View>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxIcon}>🔄</Text>
            <Text style={styles.infoBoxText}>
              This list <Text style={styles.infoBoxBold}>auto-updates</Text> every 5 seconds.
              Pull down to refresh manually.
            </Text>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Confirm Button */}
        {selectedRoute && (
          <View style={styles.confirmContainer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>
                Continue to Payment Screen
              </Text>
              <Text style={styles.confirmButtonArrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181D40',
  },
  container: {
    flex: 1,
    backgroundColor: '#181D40',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FBFBFB',
    marginTop: 15,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#FBFBFB',
    opacity: 0.7,
    marginBottom: 4,
  },
  driverName: {
    fontSize: 24,
    color: '#FFD41C',
    fontWeight: '700',
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 212, 28, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFD41C',
    overflow: 'hidden',
  },
  iconWrapper: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    fontSize: 24,
    color: '#FFD41C',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#35408E',
  },
  shuttleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#35408E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  shuttleEmoji: {
    fontSize: 30,
  },
  infoDetails: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#FBFBFB',
    opacity: 0.6,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#FBFBFB',
    fontWeight: '600',
  },
  infoSubValue: {
    fontSize: 12,
    color: '#FBFBFB',
    opacity: 0.7,
    marginTop: 2,
  },
  stepIndicator: {
    backgroundColor: '#35408E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    fontSize: 12,
    color: '#FFD41C',
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    color: '#FBFBFB',
    fontWeight: '700',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  },
  offlineIndicator: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  offlineDot: {
    backgroundColor: '#EF4444',
  },
  offlineText: {
    color: '#EF4444',
  },
  subtitle: {
    fontSize: 16,
    color: '#FBFBFB',
    opacity: 0.7,
    marginBottom: 25,
  },
  routesList: {
    flex: 1,
  },
  routeCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#35408E',
  },
  routeCardSelected: {
    borderColor: '#FFD41C',
    borderWidth: 3,
    backgroundColor: '#252947',
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 24,
  },
  selectedBadge: {
    backgroundColor: '#FFD41C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedBadgeText: {
    fontSize: 12,
    color: '#181D40',
    fontWeight: '700',
  },
  routeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD41C',
    marginBottom: 15,
  },
  routeDetailsGrid: {
    gap: 12,
  },
  routeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDetailIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  routeDetailText: {
    flex: 1,
  },
  routeDetailLabel: {
    fontSize: 12,
    color: '#FBFBFB',
    opacity: 0.6,
    marginBottom: 2,
  },
  routeDetailValue: {
    fontSize: 16,
    color: '#FBFBFB',
    fontWeight: '600',
  },
  routeDescription: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  descriptionText: {
    fontSize: 13,
    color: '#FBFBFB',
    opacity: 0.7,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    color: '#FBFBFB',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#FBFBFB',
    opacity: 0.6,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 212, 28, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFD41C',
    marginTop: 10,
  },
  infoBoxIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#FFD41C',
    lineHeight: 20,
  },
  infoBoxBold: {
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 100,
  },
  confirmContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  confirmButton: {
    backgroundColor: '#FFD41C',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD41C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmButtonText: {
    fontSize: 18,
    color: '#181D40',
    fontWeight: '700',
    marginRight: 10,
  },
  confirmButtonArrow: {
    fontSize: 24,
    color: '#181D40',
    fontWeight: '700',
  },
});