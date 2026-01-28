// src/screens/PaymentScreen.js
// FIXED: 
// 1. Now passes route's fare amount to PaymentService instead of hardcoding ₱15
// 2. Total fare display uses actual route fare
// 3. Added api import for refund functionality

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import NFCService from '../services/NFCService';
import PaymentService from '../services/PaymentService';
import api from '../services/api';

// ✅ NEW IMPORT
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentScreen({ navigation, route }) {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [passengersBoarded, setPassengersBoarded] = useState([]);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);

  const driverName = route.params?.name || 'Driver';
  const driverId = route.params?.driverId || '';
  const shuttleId = route.params?.shuttleId || 'SHUTTLE_01';
  const selectedRoute = route.params?.selectedRoute || null;
  
  // UPDATED: Extract routeId and fare for new database structure
  const routeId = selectedRoute?.id || selectedRoute?.routeId || null;
  const routeFare = selectedRoute?.fare || 15; // FIXED: Use route's fare, default to 15

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }));
    }, 1000);

    initNFC();
    checkOnlineStatus();
    updateQueueCount();

    const onlineInterval = setInterval(() => {
      checkOnlineStatus();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(onlineInterval);
      isMountedRef.current = false; // Mark as unmounted
    };
  }, []);

  useEffect(() => {
    if (!isScanning && isReady) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isScanning, isReady]);

  const initNFC = async () => {
    const enabled = await NFCService.isEnabled();
    setIsReady(enabled);
  };

  const checkOnlineStatus = async () => {
    const online = await PaymentService.isOnline();
    if (!isMountedRef.current) return; // Prevent state update after unmount
    setIsOnline(online);

    if (online && queueCount > 0 && !isSyncing) {
      setTimeout(() => {
        if (isMountedRef.current) { // Check before calling async function
          handleSync();
        }
      }, 2000);
    }
  };

  const updateQueueCount = async () => {
    const count = await PaymentService.getOfflineQueueCount();
    if (!isMountedRef.current) return; // Prevent state update after unmount
    setQueueCount(count);
  };

  const handleSync = async () => {
    if (isSyncing) return;
    if (!isMountedRef.current) return; // Prevent execution after unmount

    setIsSyncing(true);
    setSyncStatus('Syncing...');

    const result = await PaymentService.syncOfflineQueue();
    if (!isMountedRef.current) return; // Check again after async operation

    if (result.success) {
      const processedCount = result.processed || 0;
      const rejectedCount = result.rejected?.length || 0;

      if (rejectedCount > 0) {
        setSyncStatus(`✅ Synced ${processedCount} • ⚠️ ${rejectedCount} rejected`);
      } else {
        setSyncStatus(`✅ Synced ${processedCount} transaction(s)`);
      }

      await updateQueueCount();

      setTimeout(() => {
        if (isMountedRef.current) { // Safe state update
          setSyncStatus('');
        }
      }, 5000);
    } else {
      setSyncStatus('❌ Sync failed');

      setTimeout(() => {
        if (isMountedRef.current) { // Safe state update
          setSyncStatus('');
        }
      }, 5000);
    }

    setIsSyncing(false);
  };

  const handleScan = async () => {
    if (!isReady) {
      Alert.alert('NFC Not Ready', 'Please enable NFC to scan cards');
      return;
    }

    // TOGGLE: If already scanning, stop scanning
    if (isScanning) {
      console.log('🛑 Stopping scan...');
      setIsScanning(false);
      await NFCService.cancelScan();
      return;
    }

    // START SCANNING
    console.log('🔍 Starting scan...');
    setIsScanning(true);
    
    try {
      const nfcResult = await NFCService.readRFIDCard();
      
      // If user cancelled or no card detected
      if (!nfcResult.success) {
        setIsScanning(false);
        return;
      }

      const rfidUId = nfcResult.uid;

      // Check for duplicate scan (same card scanned twice)
      const alreadyScanned = passengersBoarded.find(p => p.rfidUId === rfidUId);
      if (alreadyScanned) {
        console.log('⚠️ Duplicate scan detected:', alreadyScanned.name);
        setIsScanning(false);
        Alert.alert(
          'Already Scanned',
          `${alreadyScanned.name} has already paid for this trip.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Keep scanning state while processing payment
      console.log('💳 Card detected, processing payment with fare:', routeFare);

      // FIXED: Pass routeFare to payment service
      const paymentResult = await PaymentService.processFare(
        rfidUId,
        driverId,
        shuttleId,
        routeId,
        null,      // tripId
        routeFare  // FIXED: Pass route's fare amount
      );

      // Add passenger to list
      if (paymentResult.success) {
        const passenger = {
          name: paymentResult.data.studentName,
          rfidUId: rfidUId,
          amount: paymentResult.data.fareAmount,
          transactionId: paymentResult.transactionId || paymentResult.data?.transactionId,
          timestamp: new Date().toISOString()
        };
        
        setPassengersBoarded(prev => {
          const newList = [...prev, passenger];
          console.log('✅ Passenger added:', passenger.name);
          console.log('📊 Total passengers:', newList.length);
          return newList;
        });
      }

      await updateQueueCount();

      if (paymentResult.success) {
        const data = paymentResult.data;
        navigation.navigate('Result', {
          success: true,
          studentName: data.studentName,
          fareAmount: data.fareAmount,
          previousBalance: data.previousBalance,
          newBalance: data.newBalance,
          rfidUId: rfidUId,
          userType: 'driver',
          offlineMode: paymentResult.mode === 'offline'
        });
      } else {
        const errorMsg = paymentResult.error?.error || paymentResult.message || 'Payment failed';
        const isInsufficientBalance = errorMsg.toLowerCase().includes('insufficient');

        console.log('❌ Payment failed:', errorMsg);

        navigation.navigate('Result', {
          success: false,
          message: isInsufficientBalance ? 'Please recharge' : 'Payment failed',
          error: errorMsg,
          rfidUId: rfidUId,
          userType: 'driver'
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Scan Error', 'Failed to read card. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleNext = () => {
    if (passengersBoarded.length === 0) {
      Alert.alert(
        'No Passengers Scanned',
        'You haven\'t scanned any passengers yet. Continue to route tracking anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => navigateToRouteTracking()
          }
        ]
      );
    } else {
      navigateToRouteTracking();
    }
  };

  const navigateToRouteTracking = () => {
    console.log('➡️ Going to route tracking with', passengersBoarded.length, 'passengers');
    
    // Navigate to RouteTracking WITHOUT starting the route yet
    navigation.navigate('RouteTracking', {
      driverId: driverId,
      name: driverName,
      shuttleId: shuttleId,
      selectedRoute: selectedRoute,
      passengersBoarded: passengersBoarded,
      routeFare: routeFare, // FIXED: Pass fare to tracking screen
      routeStarted: false
    });
  };

  const handleChangeRoute = () => {
    if (passengersBoarded.length > 0) {
      Alert.alert(
        'Change Route?',
        `You have ${passengersBoarded.length} passenger(s) scanned.\n\n⚠️ Their payments will be REFUNDED if you go back.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Refund & Go Back',
            style: 'destructive',
            onPress: async () => {
              try {
                // Get transaction IDs from passengers
                const transactionIds = passengersBoarded
                  .map(p => p.transactionId)
                  .filter(id => id);

                if (transactionIds.length > 0) {
                  // Call refund API
                  const response = await api.post('/shuttle/refund', {
                    transactionIds: transactionIds,
                    reason: 'Route changed by driver'
                  });

                  console.log('✅ Refund result:', response);

                  // Safely access response data
                  const refundedCount = response?.data?.refunded || response?.refunded || transactionIds.length;

                  Alert.alert(
                    'Refunded!',
                    `${refundedCount} payment(s) refunded successfully`,
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          setPassengersBoarded([]);
                          navigation.replace('RouteSelection', {
                            name: driverName,
                            driverId: driverId,
                            shuttleId: shuttleId
                          });
                        }
                      }
                    ]
                  );
                } else {
                  // No transactions to refund
                  setPassengersBoarded([]);
                  navigation.replace('RouteSelection', {
                    name: driverName,
                    driverId: driverId,
                    shuttleId: shuttleId
                  });
                }
              } catch (error) {
                console.error('Refund error:', error);
                Alert.alert('Refund Failed', 'Could not process refunds. Please try again.');
              }
            }
          }
        ]
      );
    } else {
      navigation.replace('RouteSelection', {
        name: driverName,
        driverId: driverId,
        shuttleId: shuttleId
      });
    }
  };

  // Calculate total fare using route's fare
  const totalFareCollected = passengersBoarded.length * routeFare;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleChangeRoute} style={styles.backButton}>
            <View style={styles.iconWrapper}>
              <Text style={styles.backIcon}>←</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.routeInfo}>
            <Text style={styles.routeName} numberOfLines={1}>
              {selectedRoute?.shortName || selectedRoute?.name || 'No Route'}
            </Text>
            <Text style={styles.shuttleText}>
              {shuttleId} • ₱{routeFare.toFixed(2)}/fare
            </Text>
          </View>

          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextButtonLabel}>Start</Text>
            <Text style={styles.nextIcon}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Status Bar */}
        <View style={[styles.statusBar, !isOnline && styles.statusBarOffline]}>
          <View style={styles.statusContent}>
            <View style={[styles.statusDot, !isOnline && styles.statusDotOffline]} />
            <Text style={styles.statusText}>
              {isOnline ? 
                (syncStatus || 'Online • Payments syncing in real-time') : 
                `Offline Mode • ${queueCount} payment(s) queued`
              }
            </Text>
          </View>
          {!isOnline && queueCount > 0 && (
            <TouchableOpacity onPress={handleSync} style={styles.syncBtn} disabled={isSyncing}>
              <Text style={styles.syncText}>{isSyncing ? '...' : 'Sync'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Passenger Count */}
          <View style={styles.passengerSection}>
            <Text style={styles.passengerLabel}>Passengers Boarded</Text>
            <Text style={styles.passengerCount}>{passengersBoarded.length}</Text>
            {passengersBoarded.length === 0 && (
              <Text style={{ color: '#FFD41C', fontSize: 14, marginTop: 8, textAlign: 'center', fontStyle: 'italic' }}>
                👆 Tap "Scan Card" below to collect fares
              </Text>
            )}
            <View style={styles.fareBox}>
              <Text style={styles.fareLabel}>Total Fare Collected:</Text>
              {/* FIXED: Use actual route fare */}
              <Text style={styles.fareAmount}>₱{totalFareCollected.toFixed(2)}</Text>
            </View>
          </View>

          {/* Time & Date */}
          <View style={styles.timeSection}>
            <Text style={styles.time}>{currentTime}</Text>
            <Text style={styles.date}>{currentDate}</Text>
          </View>

          {/* Scan Button */}
          <View style={styles.scanSection}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.scanButton,
                  isScanning && styles.scanButtonActive,
                  !isReady && styles.scanButtonDisabled
                ]}
                onPress={handleScan}
                disabled={!isReady}
                activeOpacity={0.8}
              >
                <Text style={styles.scanIcon}>📱</Text>
                <Text style={styles.scanText}>
                  {isScanning ? 'TAP TO STOP' : 'TAP TO SCAN'}
                </Text>
                <View style={styles.nfcStatus}>
                  <View style={[styles.nfcDot, isReady && styles.nfcDotActive]} />
                  <Text style={styles.nfcStatusText}>
                    {isReady ? 'NFC Ready' : 'NFC Disabled'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
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
  backIcon: {
    fontSize: 24,
    color: '#FFD41C',
    fontWeight: '600',
  },
  routeInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  routeName: {
    fontSize: 15,
    color: '#FFD41C',
    fontWeight: '700',
    textAlign: 'center',
  },
  shuttleText: {
    fontSize: 12,
    color: '#FBFBFB',
    opacity: 0.6,
    marginTop: 3,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#FFD41C',
    shadowColor: '#FFD41C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonLabel: {
    fontSize: 14,
    color: '#181D40',
    fontWeight: '700',
    marginRight: 5,
  },
  nextIcon: {
    fontSize: 20,
    color: '#181D40',
    fontWeight: '700',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10B981',
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  statusBarOffline: {
    backgroundColor: '#F59E0B',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FBFBFB',
    marginRight: 8,
  },
  statusDotOffline: {
    backgroundColor: '#1E1E1E',
  },
  statusText: {
    fontSize: 13,
    color: '#FBFBFB',
    fontWeight: '600',
  },
  syncBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncText: {
    fontSize: 12,
    color: '#FBFBFB',
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-around',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  scanSection: {
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#35408E',
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#FFD41C',
    shadowColor: '#FFD41C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  scanButtonActive: {
    backgroundColor: '#4B5BAD',
    borderColor: '#10B981',
  },
  scanButtonDisabled: {
    backgroundColor: '#2A2F54',
    borderColor: '#6B7280',
    opacity: 0.5,
  },
  scanIcon: {
    fontSize: 70,
    marginBottom: 12,
  },
  scanText: {
    fontSize: 20,
    color: '#FFD41C',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  nfcStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  nfcDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#6B7280',
    marginRight: 7,
  },
  nfcDotActive: {
    backgroundColor: '#10B981',
  },
  nfcStatusText: {
    fontSize: 12,
    color: '#FBFBFB',
    fontWeight: '600',
  },
  timeSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  time: {
    fontSize: 35,
    fontWeight: '700',
    color: '#FBFBFB',
    letterSpacing: 2,
    marginBottom: 6,
  },
  date: {
    fontSize: 16,
    color: '#FBFBFB',
    opacity: 0.7,
    fontWeight: '500',
  },
  passengerSection: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#35408E',
  },
  passengerLabel: {
    fontSize: 14,
    color: '#FBFBFB',
    opacity: 0.7,
    marginBottom: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  passengerCount: {
    fontSize: 65,
    fontWeight: '700',
    color: '#FFD41C',
    marginBottom: 20,
  },
  fareBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#35408E',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  fareLabel: {
    fontSize: 15,
    color: '#FBFBFB',
    opacity: 0.8,
    fontWeight: '600',
  },
  fareAmount: {
    fontSize: 22,
    color: '#10B981',
    fontWeight: '700',
  },
});