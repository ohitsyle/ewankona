// src/screens/ShuttleSelectionScreen.js
// FIXED: Added auto-refresh every 5 seconds to sync with admin dashboard
// Also added pull-to-refresh and SafeAreaView

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

export default function ShuttleSelectionScreen({ navigation, route }) {
  const [shuttles, setShuttles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShuttle, setSelectedShuttle] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  const refreshIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const driverName = route.params?.name || 'Driver';
  const driverId = route.params?.driverId || '';

  // Fetch shuttles from SyncManager (uses cache when offline)
  const fetchShuttles = async (showLoading = false) => {
    if (showLoading) setLoading(true);

    try {
      console.log('🚐 Fetching shuttles...');

      // Use SyncManager to get shuttles (automatically uses cache when offline)
      const allShuttles = await SyncManager.getShuttles();

      // Safety check: ensure allShuttles is an array
      if (!allShuttles || !Array.isArray(allShuttles)) {
        console.warn('⚠️ Shuttles data is invalid:', allShuttles);
        setShuttles([]);
        setIsOnline(NetworkService.isConnected);
        return;
      }

      // Sort: Available first, then Reserved, then Taken, hide Unavailable
      const sortedShuttles = allShuttles
        .filter(shuttle => shuttle.status !== 'unavailable')
        .sort((a, b) => {
          const statusOrder = { available: 0, reserved: 1, taken: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });

      setShuttles(sortedShuttles);
      setLastUpdated(new Date());
      setIsOnline(NetworkService.isConnected);

      // If selected shuttle is no longer available, clear selection
      if (selectedShuttle) {
        const stillExists = sortedShuttles.find(s => s.shuttleId === selectedShuttle.shuttleId);
        if (!stillExists || stillExists.status === 'taken' || stillExists.status === 'reserved') {
          setSelectedShuttle(null);
        }
      }

      console.log('✅ Shuttles loaded:', sortedShuttles.length, isOnline ? '(online)' : '(offline)');
    } catch (error) {
      console.error('❌ Failed to load shuttles:', error);
      // Fallback for initial load
      if (showLoading && shuttles.length === 0) {
        const testShuttles = [
          {
            shuttleId: 'SHUTTLE_01',
            vehicleType: 'Isuzu',
            vehicleModel: 'Traviz',
            plateNumber: 'ABC 1234',
            capacity: 15,
            status: 'available',
            currentDriver: null
          }
        ];
        setShuttles(testShuttles);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Start auto-refresh interval
  const startAutoRefresh = () => {
    stopAutoRefresh(); // Clear any existing interval
    refreshIntervalRef.current = setInterval(() => {
      try {
        fetchShuttles(false); // Silent refresh
      } catch (error) {
        console.error('❌ Auto-refresh error:', error);
        // Continue running interval even if one fetch fails
      }
    }, AUTO_REFRESH_INTERVAL);
    console.log('🔄 Auto-refresh started');
  };

  // Stop auto-refresh interval
  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
      console.log('⏹️ Auto-refresh stopped');
    }
  };

  // Handle app state changes (pause refresh when app is in background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - refresh immediately and restart interval
        console.log('📱 App came to foreground');
        fetchShuttles(false);
        startAutoRefresh();
      } else if (nextAppState.match(/inactive|background/)) {
        // App going to background - stop refreshing
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
      console.log('👁️ Screen focused');
      fetchShuttles(true);
      startAutoRefresh();

      return () => {
        console.log('👁️ Screen unfocused');
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
    fetchShuttles(false);
  };

  const handleSelectShuttle = (shuttle) => {
    if (shuttle.status === 'taken' || shuttle.status === 'reserved') {
      Alert.alert(
        'Shuttle In Use',
        `This shuttle is currently being used by ${shuttle.currentDriver || 'another driver'}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedShuttle(shuttle);
  };

  const handleConfirm = () => {
    if (!selectedShuttle) {
      Alert.alert('Select Shuttle', 'Please select a shuttle to continue');
      return;
    }

    // Re-check shuttle availability before confirming
    const currentShuttle = shuttles.find(s => s.shuttleId === selectedShuttle.shuttleId);
    if (!currentShuttle || currentShuttle.status === 'taken' || currentShuttle.status === 'reserved') {
      Alert.alert(
        'Shuttle No Longer Available',
        'This shuttle was just taken by another driver. Please select a different shuttle.',
        [{ text: 'OK' }]
      );
      setSelectedShuttle(null);
      fetchShuttles(false);
      return;
    }

    Alert.alert(
      'Confirm Shuttle',
      `Use ${selectedShuttle.vehicleType} ${selectedShuttle.vehicleModel} (${selectedShuttle.shuttleId})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // Assign shuttle to driver
              await api.post('/shuttles/assign', {
                shuttleId: selectedShuttle.shuttleId,
                driverId: driverId
              });

              console.log('✅ Shuttle assigned:', selectedShuttle.shuttleId);
              stopAutoRefresh(); // Stop refresh before navigating

              // Navigate to Route Selection
              navigation.replace('RouteSelection', {
                name: driverName,
                driverId: driverId,
                shuttleId: selectedShuttle.shuttleId,
                vehicleInfo: `${selectedShuttle.vehicleType} ${selectedShuttle.vehicleModel}`
              });
            } catch (error) {
              console.error('❌ Failed to assign shuttle:', error);
              
              // Check if error is because shuttle is already taken
              if (error.response?.status === 400) {
                Alert.alert(
                  'Shuttle Unavailable',
                  error.response?.data?.error || 'This shuttle is no longer available.',
                  [{ text: 'OK' }]
                );
                setSelectedShuttle(null);
                fetchShuttles(false);
              } else {
                // Proceed anyway for testing
                console.log('ℹ️ Proceeding without assignment confirmation');
                stopAutoRefresh();
                navigation.replace('RouteSelection', {
                  name: driverName,
                  driverId: driverId,
                  shuttleId: selectedShuttle.shuttleId,
                  vehicleInfo: `${selectedShuttle.vehicleType} ${selectedShuttle.vehicleModel}`
                });
              }
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            stopAutoRefresh();
            // Release any shuttle assigned to this driver
            try {
              await api.post('/shuttles/release-by-driver', { driverId });
            } catch (e) {
              console.warn('Release failed:', e.message);
            }
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#10B981';
      case 'taken': return '#EF4444';
      case 'unavailable': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Available';
      case 'taken': return 'In Use';
      case 'unavailable': return 'Unavailable';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD41C" />
            <Text style={styles.loadingText}>Loading shuttles...</Text>
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
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Driver Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>👤</Text>
          </View>
          <View style={styles.infoDetails}>
            <Text style={styles.infoLabel}>Driver ID</Text>
            <Text style={styles.infoValue}>{driverId}</Text>
          </View>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>Step 1 of 2</Text>
          </View>
        </View>

        {/* Title with Live Indicator */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Choose Your Shuttle</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Select a shuttle to start your shift</Text>

        {/* Shuttles List with Pull-to-Refresh */}
        <ScrollView 
          style={styles.shuttlesList} 
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
          {shuttles.map((shuttle) => (
            <TouchableOpacity
              key={shuttle.shuttleId}
              style={[
                styles.shuttleCard,
                selectedShuttle?.shuttleId === shuttle.shuttleId && styles.shuttleCardSelected,
                (shuttle.status === 'taken' || shuttle.status === 'reserved') && styles.shuttleCardTaken
              ]}
              onPress={() => handleSelectShuttle(shuttle)}
              activeOpacity={0.7}
              disabled={shuttle.status === 'taken' || shuttle.status === 'reserved'}
            >
              <View style={styles.shuttleCardHeader}>
                <View style={styles.shuttleIdContainer}>
                  <Text style={styles.shuttleIcon}>🚐</Text>
                  <Text style={styles.shuttleId}>{shuttle.shuttleId}</Text>
                </View>
                
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(shuttle.status) }
                ]}>
                  <Text style={styles.statusText}>{getStatusText(shuttle.status)}</Text>
                </View>
              </View>

              <View style={styles.shuttleCardBody}>
                <View style={styles.shuttleDetailRow}>
                  <Text style={styles.detailIcon}>🚙</Text>
                  <View style={styles.detailText}>
                    <Text style={styles.detailLabel}>Vehicle</Text>
                    <Text style={styles.detailValue}>
                      {shuttle.vehicleType} {shuttle.vehicleModel}
                    </Text>
                  </View>
                </View>

                {shuttle.plateNumber && (
                  <View style={styles.shuttleDetailRow}>
                    <Text style={styles.detailIcon}>🔢</Text>
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Plate Number</Text>
                      <Text style={styles.detailValue}>{shuttle.plateNumber}</Text>
                    </View>
                  </View>
                )}

                {shuttle.capacity && (
                  <View style={styles.shuttleDetailRow}>
                    <Text style={styles.detailIcon}>👥</Text>
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Capacity</Text>
                      <Text style={styles.detailValue}>{shuttle.capacity} passengers</Text>
                    </View>
                  </View>
                )}

                {(shuttle.status === 'taken' || shuttle.status === 'reserved') && shuttle.currentDriver && (
                  <View style={styles.shuttleDetailRow}>
                    <Text style={styles.detailIcon}>👤</Text>
                    <View style={styles.detailText}>
                      <Text style={styles.detailLabel}>Current Driver</Text>
                      <Text style={styles.detailValue}>{shuttle.currentDriver}</Text>
                    </View>
                  </View>
                )}
              </View>

              {selectedShuttle?.shuttleId === shuttle.shuttleId && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedText}>✓ Selected</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {shuttles.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🚐</Text>
              <Text style={styles.emptyText}>No shuttles available</Text>
              <Text style={styles.emptySubtext}>Please contact motorpool admin</Text>
            </View>
          )}

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxIcon}>🔄</Text>
            <View style={styles.infoBoxTextContainer}>
              <Text style={styles.infoBoxText}>
                This list <Text style={styles.infoBoxBold}>auto-updates</Text> every 5 seconds.
                Pull down to refresh manually.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Confirm Button */}
        {selectedShuttle && (
          <View style={styles.confirmContainer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>Continue to Route Selection</Text>
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#35408E',
  },
  logoutIcon: {
    fontSize: 24,
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
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#35408E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  iconEmoji: {
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
  subtitle: {
    fontSize: 16,
    color: '#FBFBFB',
    opacity: 0.7,
    marginBottom: 25,
  },
  shuttlesList: {
    flex: 1,
  },
  shuttleCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#35408E',
  },
  shuttleCardSelected: {
    borderColor: '#FFD41C',
    borderWidth: 3,
    backgroundColor: '#252947',
  },
  shuttleCardTaken: {
    opacity: 0.6,
  },
  shuttleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  shuttleIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shuttleIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  shuttleId: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD41C',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FBFBFB',
    fontWeight: '700',
  },
  shuttleCardBody: {
    gap: 12,
  },
  shuttleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#FBFBFB',
    opacity: 0.6,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#FBFBFB',
    fontWeight: '600',
  },
  selectedIndicator: {
    marginTop: 15,
    backgroundColor: '#FFD41C',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 14,
    color: '#181D40',
    fontWeight: '700',
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
  infoBoxTextContainer: {
    flex: 1,
  },
  infoBoxText: {
    fontSize: 13,
    color: '#FFD41C',
    lineHeight: 20,
    marginBottom: 4,
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