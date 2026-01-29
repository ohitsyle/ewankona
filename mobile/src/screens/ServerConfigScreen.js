// src/screens/ServerConfigScreen.js
// Server Configuration Screen - Configure server IP for different networks

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getStoredIP,
  getStoredPort,
  saveServerURL,
  testServerConnection,
  scanForServer,
  clearServerURL
} from '../config/api.config';

const { width } = Dimensions.get('window');

export default function ServerConfigScreen({ navigation, route }) {
  const isInitialSetup = route?.params?.isInitialSetup || false;

  const [serverIP, setServerIP] = useState('');
  const [serverPort, setServerPort] = useState('3000');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null); // null, 'connected', 'failed'

  const fadeAnim = useState(new Animated.Value(0))[0];
  const shakeAnim = useState(new Animated.Value(0))[0];

  // Load stored config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const storedIP = await getStoredIP();
        const storedPort = await getStoredPort();

        if (storedIP) setServerIP(storedIP);
        if (storedPort) setServerPort(storedPort.toString());
      } catch (e) {
        console.error('Error loading config:', e);
      }
    };

    loadConfig();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const shakeError = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Test connection to the server
  const handleTestConnection = async () => {
    if (!serverIP.trim()) {
      setError('Please enter server IP address');
      shakeError();
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setConnectionStatus(null);

    const port = parseInt(serverPort, 10) || 3000;
    const result = await testServerConnection(serverIP, port);

    setIsLoading(false);

    if (result.success) {
      setConnectionStatus('connected');
      setSuccess(`Connected to server at ${result.ip}:${result.port}`);
    } else {
      setConnectionStatus('failed');
      setError(`Connection failed: ${result.error}`);
      shakeError();
    }
  };

  // Save the server configuration
  const handleSave = async () => {
    if (!serverIP.trim()) {
      setError('Please enter server IP address');
      shakeError();
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    // First test the connection
    const port = parseInt(serverPort, 10) || 3000;
    const result = await testServerConnection(serverIP, port);

    if (!result.success) {
      setIsLoading(false);

      // Ask user if they want to save anyway
      Alert.alert(
        'Connection Failed',
        `Could not connect to ${serverIP}:${port}. Do you want to save this configuration anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save Anyway',
            onPress: async () => {
              await saveServerURL(serverIP, port);
              setSuccess('Configuration saved!');
              setTimeout(() => navigateAway(), 1000);
            }
          }
        ]
      );
      return;
    }

    // Connection successful, save the config
    await saveServerURL(result.ip, result.port);
    setSuccess('Configuration saved successfully!');
    setConnectionStatus('connected');
    setIsLoading(false);

    // Navigate away after a short delay
    setTimeout(() => navigateAway(), 1000);
  };

  // Auto-scan for server
  const handleAutoScan = async () => {
    setIsScanning(true);
    setError('');
    setSuccess('');
    setConnectionStatus(null);

    const port = parseInt(serverPort, 10) || 3000;
    const result = await scanForServer(port);

    setIsScanning(false);

    if (result && result.found) {
      setServerIP(result.ip);
      setConnectionStatus('connected');
      setSuccess(`Server found at ${result.ip}:${result.port}!`);
    } else {
      setError('No server found on local network. Please enter IP manually.');
      shakeError();
    }
  };

  // Clear saved configuration
  const handleClear = async () => {
    Alert.alert(
      'Clear Configuration',
      'Are you sure you want to clear the saved server configuration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearServerURL();
            setServerIP('');
            setConnectionStatus(null);
            setSuccess('Configuration cleared');
          }
        }
      ]
    );
  };

  const navigateAway = () => {
    if (isInitialSetup) {
      // Go to login screen
      navigation.replace('Login');
    } else {
      // Go back
      navigation.goBack();
    }
  };

  const getStatusColor = () => {
    if (connectionStatus === 'connected') return '#10B981';
    if (connectionStatus === 'failed') return '#EF4444';
    return '#FFD41C';
  };

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
            {/* Header */}
            <View style={styles.header}>
              {!isInitialSetup && (
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
              )}

              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoIcon}>🌐</Text>
                </View>
                <Text style={styles.title}>Server Configuration</Text>
                <Text style={styles.subtitle}>
                  {isInitialSetup
                    ? 'Configure the server connection to get started'
                    : 'Update your server connection settings'
                  }
                </Text>
              </View>
            </View>

            {/* Status Indicator */}
            {connectionStatus && (
              <View style={[styles.statusBanner, { backgroundColor: `${getStatusColor()}20`, borderColor: getStatusColor() }]}>
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {connectionStatus === 'connected' ? '✓ Connected' : '✗ Not Connected'}
                </Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.form}>
              {/* Server IP */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Server IP Address</Text>
                <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnim }] }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="192.168.1.100"
                    placeholderTextColor="rgba(251,251,251,0.3)"
                    value={serverIP}
                    onChangeText={(text) => {
                      setServerIP(text);
                      setError('');
                      setConnectionStatus(null);
                    }}
                    keyboardType="numeric"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </Animated.View>
                <Text style={styles.hint}>
                  Enter the IP address of the computer running the server
                </Text>
              </View>

              {/* Server Port */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Port</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="3000"
                    placeholderTextColor="rgba(251,251,251,0.3)"
                    value={serverPort}
                    onChangeText={(text) => {
                      setServerPort(text.replace(/[^0-9]/g, ''));
                      setError('');
                      setConnectionStatus(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                <Text style={styles.hint}>Default: 3000</Text>
              </View>

              {/* Messages */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {success ? <Text style={styles.successText}>{success}</Text> : null}

              {/* Buttons */}
              <View style={styles.buttonGroup}>
                {/* Test Connection */}
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={handleTestConnection}
                  disabled={isLoading || isScanning}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFD41C" size="small" />
                  ) : (
                    <>
                      <Text style={styles.secondaryButtonText}>🔌 Test Connection</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Auto Scan */}
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={handleAutoScan}
                  disabled={isLoading || isScanning}
                >
                  {isScanning ? (
                    <>
                      <ActivityIndicator color="#FFD41C" size="small" style={{ marginRight: 8 }} />
                      <Text style={styles.secondaryButtonText}>Scanning...</Text>
                    </>
                  ) : (
                    <Text style={styles.secondaryButtonText}>🔍 Auto-Scan Network</Text>
                  )}
                </TouchableOpacity>

                {/* Save */}
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton, (isLoading || isScanning) && styles.buttonDisabled]}
                  onPress={handleSave}
                  disabled={isLoading || isScanning}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Saving...' : '✓ Save Configuration'}
                  </Text>
                </TouchableOpacity>

                {/* Clear Config (only show if not initial setup) */}
                {!isInitialSetup && serverIP && (
                  <TouchableOpacity
                    style={[styles.button, styles.dangerButton]}
                    onPress={handleClear}
                  >
                    <Text style={styles.dangerButtonText}>🗑 Clear Configuration</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Help Section */}
            <View style={styles.helpSection}>
              <Text style={styles.helpTitle}>📖 How to find your server IP:</Text>
              <Text style={styles.helpText}>
                1. On the computer running the server, open a terminal{'\n'}
                2. Run <Text style={styles.codeText}>ipconfig</Text> (Windows) or <Text style={styles.codeText}>ifconfig</Text> (Mac/Linux){'\n'}
                3. Look for the IPv4 address (usually starts with 192.168.x.x){'\n'}
                4. Make sure your phone and computer are on the same WiFi network
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Header
  header: {
    marginTop: 10,
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFD41C',
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#35408E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#FFD41C',
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FBFBFB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(251,251,251,0.6)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Status Banner
  statusBanner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Form
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD41C',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#35408E',
  },
  input: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#FBFBFB',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  hint: {
    fontSize: 12,
    color: 'rgba(251,251,251,0.4)',
    marginTop: 6,
    marginLeft: 4,
  },

  // Messages
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  successText: {
    color: '#10B981',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },

  // Buttons
  buttonGroup: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: '#FFD41C',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#181D40',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#35408E',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFD41C',
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#EF4444',
    marginTop: 8,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Help Section
  helpSection: {
    backgroundColor: 'rgba(53, 64, 142, 0.3)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 212, 28, 0.2)',
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFD41C',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 13,
    color: 'rgba(251,251,251,0.7)',
    lineHeight: 22,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 4,
    color: '#FFD41C',
  },
});
