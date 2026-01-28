// src/screens/ResultScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

// ✅ NEW IMPORT
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResultScreen({ navigation, route }) {
  const {
    success,
    studentName,
    fareAmount,
    previousBalance,
    newBalance,
    message,
    error,
    rfidUId,
    userType = 'driver'
  } = route.params || {};

  const scaleValue = new Animated.Value(0);

  // Determine screen type based on balance
  const getScreenType = () => {
    if (!success) return 'failure'; // Red - payment failed
    if (newBalance < 0) {
      // Orange - went negative or already negative
      return 'warning';
    }
    // Green - positive balance
    return 'success';
  };

  const screenType = getScreenType();

  useEffect(() => {
    // Animate in
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Auto return after 4 seconds
    const timer = setTimeout(() => {
      navigation.goBack();
    }, 4000);

    return () => clearTimeout(timer);
  }, [scaleValue, navigation]);

  const handleDone = () => {
    navigation.goBack();
  };

  // Get colors based on screen type
  const getColors = () => {
    switch(screenType) {
      case 'success':
        return {
          background: '#10B981', // Emerald Green
          icon: '✓',
          title: 'Payment Successful!',
          iconBg: 'rgba(255,255,255,0.25)'
        };
      case 'warning':
        return {
          background: '#F59E0B', // Amber Orange
          icon: '⚠',
          title: 'Payment Successful',
          iconBg: 'rgba(255,255,255,0.25)'
        };
      case 'failure':
        return {
          background: '#EF4444', // Red
          icon: '✗',
          title: message?.toLowerCase().includes('recharge') ? 'Insufficient Balance' : 'Payment Failed',
          iconBg: 'rgba(255,255,255,0.2)'
        };
      default:
        // FIXED: Added default case to prevent undefined return
        return {
          background: '#6B7280', // Gray - Unknown state
          icon: '?',
          title: 'Unknown Status',
          iconBg: 'rgba(255,255,255,0.2)'
        };
    }
  };

  const colors = getColors();

  return (
    // ✅ SAFE AREA WRAPPER ADDED
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {success ? (
        // SUCCESS OR WARNING SCREEN
        <View style={[styles.container]}>
          <Animated.View style={[styles.content, { transform: [{ scale: scaleValue }] }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconBg }]}>
              <Text style={styles.icon}>{colors.icon}</Text>
            </View>

            <Text style={styles.title}>{colors.title}</Text>

            <View style={styles.card}>
              <Text style={styles.studentName}>{studentName}</Text>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Amount Paid:</Text>
                <Text style={[styles.value, styles.deduction]}>₱{fareAmount?.toFixed(2)}</Text>
              </View>

              {screenType === 'warning' && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningIcon}>⚠️</Text>
                  <Text style={styles.warningTitle}>Negative Balance Active</Text>
                  <Text style={styles.warningSubtext}>
                    {newBalance <= -14
                      ? 'Balance limit reached. Please recharge soon!'
                      : `You won't be able to make further transactions until you recharge.`}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.doneButton, { borderColor: '#FBFBFB' }]}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>

            <Text style={styles.autoClose}>Auto-closing in 4 seconds...</Text>
          </Animated.View>
        </View>
      ) : (
        // FAILURE SCREEN
        <View style={[styles.container]}>
          <Animated.View style={[styles.content, { transform: [{ scale: scaleValue }] }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconBg }]}>
              <Text style={styles.icon}>{colors.icon}</Text>
            </View>

            <Text style={styles.title}>{colors.title}</Text>

            <View style={[styles.card, styles.failureCard]}>
              <Text style={styles.errorTitle}>
                {message?.toLowerCase().includes('recharge')
                  ? 'Please Recharge Your Card'
                  : 'Transaction Declined'}
              </Text>

              {rfidUId && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.cardIdRow}>
                    <Text style={styles.cardIdLabel}>Card ID:</Text>
                    <Text style={styles.cardIdValue}>{rfidUId}</Text>
                  </View>
                </>
              )}

              {error && !message?.toLowerCase().includes('recharge') && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.doneButton, styles.failureDoneButton]}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>Try Again</Text>
            </TouchableOpacity>

            <Text style={styles.autoClose}>Auto-closing in 4 seconds...</Text>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ✅ NEW SAFE AREA STYLE
  safeArea: {
    flex: 1,
    justifyContent: 'center',
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 60,
    color: '#FBFBFB',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FBFBFB',
    marginBottom: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FBFBFB',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    marginBottom: 30,
  },
  failureCard: {
    borderColor: '#FBFBFB',
    borderWidth: 2,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E1E1E',
    textAlign: 'center',
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  label: {
    fontSize: 16,
    color: '#6B7280',
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E1E1E',
  },
  deduction: {
    color: '#EF4444',
    fontSize: 24,
    fontWeight: '700',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 20,
    borderRadius: 15,
    marginTop: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  warningIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  warningTitle: {
    color: '#D97706',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 5,
  },
  warningSubtext: {
    color: '#92400E',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#EF4444',
    textAlign: 'center',
  },
  cardIdRow: {
    alignItems: 'center',
  },
  cardIdLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  cardIdValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E1E1E',
    fontFamily: 'monospace',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  errorText: {
    fontSize: 13,
    color: '#B91C1C',
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: 'rgba(251, 251, 251, 0.25)',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
  },
  failureDoneButton: {
    backgroundColor: 'rgba(251, 251, 251, 0.2)',
    borderColor: '#FBFBFB',
  },
  doneButtonText: {
    color: '#FBFBFB',
    fontSize: 18,
    fontWeight: '700',
  },
  autoClose: {
    color: 'rgba(251, 251, 251, 0.7)',
    fontSize: 12,
    marginTop: 15,
  },
});