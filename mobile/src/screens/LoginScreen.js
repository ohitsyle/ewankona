// src/screens/LoginScreen.js
// FIXED: 
// 1. Better UI positioning (not too low)
// 2. 6-digit PIN support
// 3. Proper React hooks (no conditional hooks)
// 4. bcrypt hashed password support on backend

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Vibration,
  Platform,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const PIN_LENGTH = 6; // 6-digit PIN

export default function LoginScreen({ navigation }) {
  // All useState hooks at the top, unconditionally
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // useRef hooks for animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pinInputRef = useRef(null);
  const emailInputRef = useRef(null);

  // Initial fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === PIN_LENGTH && step === 'pin' && !isLoading) {
      handlePinSubmit();
    }
  }, [pin, step, isLoading, handlePinSubmit]);

  const shakeError = useCallback(() => {
    // Safe vibration - wrapped in try/catch to prevent crashes
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(100);
      } catch (vibError) {
        console.log('Vibration not available:', vibError.message);
      }
    }

    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleEmailSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Please enter your email');
      shakeError();
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      shakeError();
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/login/check-email', {
        email: email.trim().toLowerCase()
      });

      // Safely check response
      if (res && res.data && res.data.exists) {
        setUserName(res.data.name || 'User');
        // Animate transition to PIN screen
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setStep('pin');
        });
      } else {
        setError('Email not found. Please check and try again.');
        shakeError();
      }
    } catch (e) {
      console.error('Check email error:', e);

      // Safe error message extraction
      let errorMsg = 'Failed to verify email';
      if (e.response && e.response.data && e.response.data.error) {
        errorMsg = e.response.data.error;
      } else if (e.message) {
        errorMsg = e.message;
      }

      setError(errorMsg);
      shakeError();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = useCallback(async () => {
    if (pin.length !== PIN_LENGTH) {
      setError(`Please enter ${PIN_LENGTH} digits`);
      shakeError();
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/login', {
        emailOrUsername: email.trim().toLowerCase(),
        password: pin
      });

      // Safely check response and token
      if (res && res.data && res.data.token) {
        try {
          await AsyncStorage.setItem('auth_token', res.data.token);
          await AsyncStorage.setItem('user_role', res.data.role || 'user');

          if (res.data.role === 'driver') {
            await AsyncStorage.setItem('driver_id', res.data.driverId || '');
            navigation.replace('ShuttleSelection', {
              driverId: res.data.driverId,
              name: res.data.name || 'Driver'
            });
          } else if (res.data.role === 'merchant') {
            await AsyncStorage.setItem('merchant_id', res.data.merchantId || '');
            navigation.replace('Merchant', {
              merchantId: res.data.merchantId,
              businessName: res.data.businessName || 'Merchant',
              contactPerson: res.data.contactPerson || ''
            });
          } else if (res.data.role === 'student' || res.data.role === 'employee') {
            await AsyncStorage.setItem('user_id', res.data.userId || '');
            navigation.replace('UserDashboard', {
              userId: res.data.userId,
              userEmail: res.data.email,
              role: res.data.role,
              name: res.data.name || 'User'
            });
          } else {
            // Unknown role
            setError('Unknown account type. Please contact support.');
            setPin('');
            shakeError();
          }
        } catch (storageError) {
          console.error('AsyncStorage error:', storageError);
          setError('Failed to save login session. Please try again.');
          setPin('');
          shakeError();
        }
      } else {
        setError('Invalid PIN. Please try again.');
        setPin('');
        shakeError();
      }
    } catch (e) {
      console.error('Login error:', e);

      // Safe error message extraction
      let errorMsg = 'Invalid PIN. Please try again.';
      if (e.response && e.response.data && e.response.data.error) {
        errorMsg = e.response.data.error;
      } else if (e.message) {
        // Network errors, timeout, etc.
        if (e.message.includes('Network')) {
          errorMsg = 'Network error. Please check your connection.';
        } else if (e.message.includes('timeout')) {
          errorMsg = 'Request timeout. Please try again.';
        } else {
          errorMsg = 'Login failed. Please try again.';
        }
      }

      setError(errorMsg);
      setPin('');
      shakeError();
    } finally {
      setIsLoading(false);
    }
  }, [email, pin, shakeError, navigation]);

  const handlePinPress = (digit) => {
    if (pin.length < PIN_LENGTH && !isLoading) {
      setPin(prev => prev + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    if (!isLoading) {
      setPin(prev => prev.slice(0, -1));
      setError('');
    }
  };

  const handleBack = () => {
    setStep('email');
    setPin('');
    setError('');
    slideAnim.setValue(0);
  };

  const renderPinDots = () => {
    return (
      <Animated.View 
        style={[
          styles.pinDotsContainer,
          { transform: [{ translateX: shakeAnim }] }
        ]}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              pin.length > index && styles.pinDotFilled,
              error ? styles.pinDotError : null
            ]}
          />
        ))}
      </Animated.View>
    );
  };

  const renderNumpad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'DEL']
    ];

    return (
      <View style={styles.numpad}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numpadRow}>
            {row.map((num, colIndex) => {
              if (num === '') {
                return <View key={colIndex} style={styles.numpadButtonEmpty} />;
              }
              
              const isBackspace = num === 'DEL';
              
              return (
                <TouchableOpacity
                  key={colIndex}
                  style={[
                    styles.numpadButton,
                    isBackspace && styles.numpadButtonBackspace
                  ]}
                  onPress={() => isBackspace ? handleBackspace() : handlePinPress(num)}
                  activeOpacity={0.6}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.numpadText,
                    isBackspace && styles.numpadTextBackspace
                  ]}>
                    {isBackspace ? '⌫' : num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  // ========================================
  // EMAIL ENTRY SCREEN
  // ========================================
  if (step === 'email') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
              {/* Logo Section - FIXED: Better positioning */}
              <View style={styles.logoSection}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoIcon}>🚐</Text>
                </View>
                <Text style={styles.appName}>NUCash</Text>
                <Text style={styles.tagline}>Shuttle & Payment System</Text>
              </View>

              {/* Email Form - FIXED: Centered better */}
              <View style={styles.formSection}>
                <Text style={styles.welcomeText}>Welcome back!</Text>
                <Text style={styles.instructionText}>Enter your email to continue</Text>

                <Animated.View 
                  style={[
                    styles.inputContainer,
                    { transform: [{ translateX: shakeAnim }] }
                  ]}
                >
                  <Text style={styles.inputIcon}>📧</Text>
                  <TextInput
                    ref={emailInputRef}
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="rgba(251,251,251,0.4)"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError('');
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!isLoading}
                    returnKeyType="next"
                    onSubmitEditing={handleEmailSubmit}
                  />
                </Animated.View>

                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.continueButton, isLoading && styles.buttonDisabled]}
                  onPress={handleEmailSubmit}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.continueButtonText}>
                    {isLoading ? 'Checking...' : 'Continue'}
                  </Text>
                  {!isLoading && <Text style={styles.buttonArrow}>→</Text>}
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>National University</Text>

                {/* Server Settings Button */}
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={() => navigation.navigate('ServerConfig', { isInitialSetup: false })}
                >
                  <Text style={styles.settingsButtonText}>⚙️ Server Settings</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ========================================
  // PIN ENTRY SCREEN
  // ========================================
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.pinContainer}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* User Info - FIXED: Better spacing */}
        <View style={styles.userSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.greetingText}>Hi, {userName}!</Text>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* PIN Entry */}
        <View style={styles.pinSection}>
          <Text style={styles.pinTitle}>Enter your 6-digit PIN</Text>
          
          {renderPinDots()}

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.pinHint}>
              {isLoading ? 'Verifying...' : 'Tap the numbers below'}
            </Text>
          )}
        </View>

        {/* Numpad - FIXED: Better positioning */}
        {renderNumpad()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181D40',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#181D40',
    paddingHorizontal: 30,
    justifyContent: 'center', // FIXED: Center content vertically
  },
  pinContainer: {
    flex: 1,
    backgroundColor: '#181D40',
    paddingHorizontal: 30,
  },
  
  // Logo Section - FIXED: Adjusted spacing
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#35408E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#FFD41C',
    shadowColor: '#FFD41C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 50,
  },
  appName: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFD41C',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(251,251,251,0.6)',
    marginTop: 4,
  },

  // Form Section - FIXED: Better spacing
  formSection: {
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FBFBFB',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(251,251,251,0.6)',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#35408E',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 17,
    color: '#FBFBFB',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD41C',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#FFD41C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#B89A15',
    opacity: 0.7,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#181D40',
  },
  buttonArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: '#181D40',
    marginLeft: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },

  // Footer
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(251,251,251,0.4)',
  },
  settingsButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  settingsButtonText: {
    fontSize: 13,
    color: 'rgba(255,212,28,0.6)',
    fontWeight: '500',
  },

  // Back Button
  backButton: {
    paddingVertical: 12,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFD41C',
    fontWeight: '600',
  },

  // User Section (PIN screen) - FIXED: Better spacing
  userSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#35408E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#FFD41C',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFD41C',
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FBFBFB',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: 'rgba(251,251,251,0.5)',
  },

  // PIN Section
  pinSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pinTitle: {
    fontSize: 17,
    color: 'rgba(251,251,251,0.8)',
    marginBottom: 20,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#35408E',
    backgroundColor: 'transparent',
    marginHorizontal: 6,
  },
  pinDotFilled: {
    backgroundColor: '#FFD41C',
    borderColor: '#FFD41C',
  },
  pinDotError: {
    borderColor: '#EF4444',
  },
  pinHint: {
    fontSize: 14,
    color: 'rgba(251,251,251,0.5)',
    marginTop: 4,
  },

  // Numpad - FIXED: Better sizing and spacing
  numpad: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  numpadButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#35408E',
  },
  numpadButtonEmpty: {
    width: 68,
    height: 68,
    marginHorizontal: 10,
  },
  numpadButtonBackspace: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  numpadText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FBFBFB',
  },
  numpadTextBackspace: {
    fontSize: 26,
    color: '#FFD41C',
  },
});