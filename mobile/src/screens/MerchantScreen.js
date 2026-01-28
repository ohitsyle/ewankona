// src/screens/MerchantScreen.js
// REDESIGNED: Modern design matching shuttle screens + new features

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Animated } from 'react-native';
import NFCService from '../services/NFCService';
import PaymentService from '../services/PaymentService';

// ========== OPTIMIZED COMPONENTS ==========
const NumberButton = React.memo(({ value, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.numButton, disabled && styles.numButtonDisabled]}
    onPress={onPress}
    activeOpacity={0.6}
    disabled={disabled}
  >
    <Text style={styles.numButtonText}>{value}</Text>
  </TouchableOpacity>
));

const PinDots = React.memo(({ filledCount }) => (
  <View style={styles.pinDotsContainer}>
    {[0, 1, 2, 3, 4, 5].map((index) => (
      <View
        key={index}
        style={[
          styles.pinDot,
          index < filledCount && styles.pinDotFilled
        ]}
      />
    ))}
  </View>
));

export default function MerchantScreen({ navigation, route }) {
  const [amount, setAmount] = useState('');
  const [isWaitingForCard, setIsWaitingForCard] = useState(false);
  const [isWaitingForPin, setIsWaitingForPin] = useState(false);
  const [pin, setPin] = useState('');
  const [rfidUId, setCardUid] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [todayTransactions, setTodayTransactions] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));

  const businessName = route.params?.businessName || 'Merchant';
  const merchantId = route.params?.merchantId || '';
  const contactPerson = route.params?.contactPerson || '';

  // Clock and pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isWaitingForCard) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
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
  }, [isWaitingForCard]);

  // ========== OPTIMIZED HANDLERS ==========
  const handleNumberPress = useCallback((num) => {
    if (isWaitingForPin) {
      setPin(prev => {
        if (prev.length >= 6) return prev;
        const newPin = prev + num;
        if (newPin.length === 6) {
          setTimeout(() => handlePinSubmit(newPin), 50);
        }
        return newPin;
      });
    } else {
      setAmount(prev => {
        if (prev.length >= 7) return prev;
        if (num === '.') {
          if (prev.includes('.')) return prev;
          return prev === '' ? '0.' : prev + '.';
        }
        return prev + num;
      });
    }
  }, [isWaitingForPin]);

  const handleBackspace = useCallback(() => {
    if (isWaitingForPin) {
      setPin(prev => prev.slice(0, -1));
    } else {
      setAmount(prev => prev.slice(0, -1));
    }
  }, [isWaitingForPin]);

  const handleClear = useCallback(() => {
    if (isWaitingForPin) {
      setPin('');
    } else {
      setAmount('');
    }
  }, [isWaitingForPin]);

  const handleConfirm = useCallback(() => {
    const total = parseFloat(amount);
    if (!amount || isNaN(total) || total <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    setIsWaitingForCard(true);
    startScan(total);
  }, [amount]);

  const startScan = async (total) => {
    try {
      const nfcResult = await NFCService.readRFIDCard();
      if (!nfcResult.success) {
        Alert.alert('Scan Failed', nfcResult.error || 'Could not read card');
        setIsWaitingForCard(false);
        return;
      }

      setCardUid(nfcResult.uid);
      setIsWaitingForCard(false);
      setIsWaitingForPin(true);
      setPin('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to scan card');
      setIsWaitingForCard(false);
    }
  };

  const handlePinSubmit = async (pinToSubmit = pin) => {
    if (pinToSubmit.length !== 6) return;

    setIsProcessing(true);

    try {
      const total = parseFloat(amount);

      const paymentResult = await PaymentService.processMerchantPayment(
        rfidUId, 
        total, 
        merchantId,
        pinToSubmit
      );

      if (paymentResult.success) {
        const data = paymentResult.data || {};  // Safe fallback

        // Update today's stats
        setTodayTransactions(prev => prev + 1);
        setTodayRevenue(prev => prev + total);

        setIsWaitingForPin(false);
        setPin('');
        setAmount('');
        setCardUid('');

        navigation.navigate('Result', {
          success: true,
          studentName: data.studentName || 'Unknown',  // Safe fallback
          fareAmount: total,
          previousBalance: data.previousBalance || 0,  // Safe fallback
          newBalance: data.newBalance || 0,  // Safe fallback
          rfidUId: rfidUId,
          userType: 'merchant'
        });
      } else {
        const errorMsg = paymentResult.error?.error || 'Payment failed';

        if (errorMsg.toLowerCase().includes('pin') || errorMsg.toLowerCase().includes('incorrect')) {
          Alert.alert(
            'Incorrect PIN',
            'The PIN you entered is incorrect. Please try again.',
            [
              {
                text: 'Try Again',
                onPress: () => {
                  setPin('');
                  setIsProcessing(false);
                }
              },
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: handleCancelPin
              }
            ]
          );
        } else if (errorMsg.toLowerCase().includes('insufficient')) {
          // Handle insufficient balance with user-friendly alert
          Alert.alert(
            'Insufficient Balance',
            'The student does not have enough balance for this transaction. Please ask them to top up their NUCash account.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setIsWaitingForPin(false);
                  setPin('');
                  setAmount('');
                  setCardUid('');
                  setIsProcessing(false);
                }
              }
            ]
          );
        } else {
          setIsWaitingForPin(false);
          setPin('');
          setAmount('');
          setCardUid('');

          navigation.navigate('Result', {
            success: false,
            message: 'Payment Failed',
            error: errorMsg,
            rfidUId: rfidUId,
            userType: 'merchant'
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to process payment');
      handleCancelPin();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPin = useCallback(() => {
    setIsWaitingForPin(false);
    setIsWaitingForCard(false);
    setPin('');
    setAmount('');
    setCardUid('');
    setIsProcessing(false);
    NFCService.cleanup();
  }, []);

  // ========== QUICK AMOUNT BUTTONS ==========
  const quickAmounts = useMemo(() => [50, 100, 200, 500], []);

  const handleQuickAmount = useCallback((value) => {
    setAmount(value.toString());
  }, []);

  // ========== MEMOIZED BUTTON ARRAYS ==========
  const numberButtons = useMemo(() => [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', '⌫']
  ], []);

  const pinNumberButtons = useMemo(() => [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫']
  ], []);

  return (
    <View style={styles.container}>
      {/* ========== HEADER ========== */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setSidebarVisible(true)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.businessName}>{businessName}</Text>
          <Text style={styles.merchantLabel}>Merchant Terminal</Text>
        </View>
        <View style={styles.timeBox}>
          <Text style={styles.timeText}>{currentTime}</Text>
          <Text style={styles.dateText}>{currentDate}</Text>
        </View>
      </View>

      {/* ========== SIDEBAR MODAL ========== */}
      <Modal
        visible={sidebarVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSidebarVisible(false)}
        >
          <View style={styles.sidebar} onStartShouldSetResponder={() => true}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Profile</Text>
              <TouchableOpacity onPress={() => setSidebarVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.profileSection}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>🏪</Text>
              </View>
              <Text style={styles.profileName}>{businessName}</Text>
              <Text style={styles.profileRole}>Merchant Terminal</Text>
              
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Merchant ID:</Text>
                <Text style={styles.infoValue}>{merchantId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contact:</Text>
                <Text style={styles.infoValue}>{contactPerson}</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.statsTitle}>Today's Summary</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{todayTransactions}</Text>
                  <Text style={styles.statLabel}>Transactions</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>₱{todayRevenue.toFixed(2)}</Text>
                  <Text style={styles.statLabel}>Collections</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                setSidebarVisible(false);
                navigation.replace('Login');
              }}
            >
              <Text style={styles.logoutButtonText}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========== SCREEN 1: Amount Entry ========== */}
      {!isWaitingForCard && !isWaitingForPin && (
        <View style={styles.contentContainer}>
          
          {/* Display */}
          <View style={styles.displaySection}>
            <Text style={styles.displayLabel}>Amount</Text>
            <View style={styles.displayBox}>
              <Text style={styles.currencySymbol}>₱</Text>
              <Text style={styles.displayAmount}>{amount || '0'}</Text>
            </View>
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmountSection}>
            <Text style={styles.quickAmountLabel}>Quick Amount</Text>
            <View style={styles.quickAmountButtons}>
              {quickAmounts.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={styles.quickAmountBtn}
                  onPress={() => handleQuickAmount(value)}
                >
                  <Text style={styles.quickAmountText}>₱{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Numpad */}
          <View style={styles.numPad}>
            {numberButtons.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.numRow}>
                {row.map((value) => (
                  <NumberButton
                    key={value}
                    value={value}
                    onPress={() => value === '⌫' ? handleBackspace() : handleNumberPress(value)}
                    disabled={isProcessing}
                  />
                ))}
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, !amount && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={!amount}
            >
              <Text style={styles.confirmButtonText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ========== SCREEN 2: Waiting for Card ========== */}
      {isWaitingForCard && !isWaitingForPin && (
        <View style={styles.scanContainer}>
          <Text style={styles.scanAmount}>₱{parseFloat(amount).toFixed(2)}</Text>
          
          <Animated.View style={[styles.scanIconWrapper, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.scanIcon}>
              <Text style={styles.scanIconText}>📱</Text>
            </View>
          </Animated.View>
          
          <Text style={styles.scanTitle}>Tap Card to Pay</Text>
          <Text style={styles.scanInstruction}>Ask customer to tap their student ID</Text>
          
          <TouchableOpacity style={styles.cancelScanButton} onPress={handleCancelPin}>
            <Text style={styles.cancelScanButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ========== SCREEN 3: PIN Entry ========== */}
      {isWaitingForPin && (
        <View style={styles.pinContainer}>
          <View style={styles.pinHeader}>
            <Text style={styles.pinAmount}>₱{parseFloat(amount).toFixed(2)}</Text>
            <View style={styles.securityBadge}>
              <Text style={styles.securityIcon}>🔒</Text>
              <Text style={styles.securityText}>Secure PIN</Text>
            </View>
          </View>

          <PinDots filledCount={pin.length} />

          <Text style={styles.pinInstruction}>
            {isProcessing ? 'Processing payment...' : 'Enter 6-digit PIN'}
          </Text>

          <View style={styles.numPad}>
            {pinNumberButtons.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.numRow}>
                {row.map((value) => (
                  value ? (
                    <NumberButton
                      key={value}
                      value={value}
                      onPress={() => value === '⌫' ? handleBackspace() : handleNumberPress(value)}
                      disabled={isProcessing}
                    />
                  ) : (
                    <View key="empty" style={styles.numButton} />
                  )
                ))}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.cancelPinButton}
            onPress={handleCancelPin}
            disabled={isProcessing}
          >
            <Text style={styles.cancelPinButtonText}>Cancel Transaction</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 2,
    borderBottomColor: '#35408E',
  },
  menuBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#35408E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#FFD41C',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  businessName: {
    fontSize: 20,
    color: '#FFD41C',
    fontWeight: '700',
  },
  merchantLabel: {
    fontSize: 12,
    color: '#FBFBFB',
    opacity: 0.6,
    marginTop: 2,
  },
  timeBox: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 16,
    color: '#FBFBFB',
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
    color: '#FBFBFB',
    opacity: 0.6,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sidebar: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: '85%',
    borderTopWidth: 2,
    borderTopColor: '#35408E',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFD41C',
  },
  closeBtn: {
    fontSize: 28,
    color: '#FBFBFB',
    fontWeight: '300',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#35408E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#FFD41C',
  },
  avatarText: {
    fontSize: 50,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FBFBFB',
    marginBottom: 5,
  },
  profileRole: {
    fontSize: 14,
    color: '#FFD41C',
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#35408E',
    marginVertical: 15,
  },
  infoRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#FBFBFB',
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    color: '#FBFBFB',
    fontWeight: '600',
  },
  statsTitle: {
    fontSize: 16,
    color: '#FFD41C',
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#35408E',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    color: '#FFD41C',
    fontWeight: '700',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#FBFBFB',
    opacity: 0.7,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  displaySection: {
    marginBottom: 25,
  },
  displayLabel: {
    fontSize: 14,
    color: '#FBFBFB',
    opacity: 0.6,
    marginBottom: 10,
    fontWeight: '600',
  },
  displayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderWidth: 2,
    borderColor: '#35408E',
  },
  currencySymbol: {
    fontSize: 36,
    color: '#FFD41C',
    fontWeight: '700',
    marginRight: 10,
  },
  displayAmount: {
    fontSize: 48,
    color: '#FBFBFB',
    fontWeight: '700',
    flex: 1,
  },
  quickAmountSection: {
    marginBottom: 25,
  },
  quickAmountLabel: {
    fontSize: 14,
    color: '#FBFBFB',
    opacity: 0.6,
    marginBottom: 10,
    fontWeight: '600',
  },
  quickAmountButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAmountBtn: {
    flex: 1,
    backgroundColor: '#35408E',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD41C',
  },
  quickAmountText: {
    color: '#FFD41C',
    fontSize: 16,
    fontWeight: '700',
  },
  numPad: {
    marginBottom: 15,
  },
  numRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  numButton: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    paddingVertical: 18,
    marginHorizontal: 5,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#35408E',
  },
  numButtonDisabled: {
    opacity: 0.3,
  },
  numButtonText: {
    color: '#FBFBFB',
    fontSize: 24,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  clearButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#35408E',
  },
  clearButtonText: {
    color: '#FBFBFB',
    fontSize: 16,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonDisabled: {
    opacity: 0.3,
  },
  confirmButtonText: {
    color: '#FBFBFB',
    fontSize: 18,
    fontWeight: '700',
  },
  scanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  scanAmount: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFD41C',
    marginBottom: 40,
  },
  scanIconWrapper: {
    marginBottom: 30,
  },
  scanIcon: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#35408E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#FFD41C',
    shadowColor: '#FFD41C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  scanIconText: {
    fontSize: 70,
  },
  scanTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FBFBFB',
    marginBottom: 10,
  },
  scanInstruction: {
    fontSize: 16,
    color: '#FBFBFB',
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 40,
  },
  cancelScanButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  cancelScanButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  pinContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  pinHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  pinAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFD41C',
    marginBottom: 15,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#35408E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD41C',
  },
  securityIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#FBFBFB',
    fontWeight: '700',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: '#35408E',
    marginHorizontal: 6,
  },
  pinDotFilled: {
    backgroundColor: '#FFD41C',
    borderColor: '#FFD41C',
  },
  pinInstruction: {
    fontSize: 14,
    color: '#FBFBFB',
    opacity: 0.6,
    marginBottom: 25,
    textAlign: 'center',
  },
  cancelPinButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
    marginTop: 10,
  },
  cancelPinButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
});