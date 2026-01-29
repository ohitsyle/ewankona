// src/navigation/AppNavigator.js
// UPDATED: Added ServerConfig screen for dynamic IP configuration

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import ServerConfigScreen from '../screens/ServerConfigScreen';
import ShuttleSelectionScreen from '../screens/ShuttleSelectionScreen';
import RouteSelectionScreen from '../screens/RouteSelectionScreen';
import PaymentScreen from '../screens/PaymentScreen';
import RouteTrackingScreen from '../screens/RouteTrackingScreen';
import ResultScreen from '../screens/ResultScreen';
import MerchantScreen from '../screens/MerchantScreen';
import UserDashboardScreen from '../screens/UserDashboardScreen';

import { initializeAPIConfig, isServerConfigured } from '../config/api.config';
import { initializeAPI } from '../services/api';

const Stack = createNativeStackNavigator();

// Loading screen while checking configuration
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FFD41C" />
      <Text style={styles.loadingText}>Initializing...</Text>
    </View>
  );
}

export default function AppNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [needsConfig, setNeedsConfig] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize API configuration
        await initializeAPIConfig();
        await initializeAPI();

        // Check if server is configured
        const configured = isServerConfigured();
        setNeedsConfig(!configured);

        console.log('📱 App initialized, server configured:', configured);
      } catch (error) {
        console.error('Initialization error:', error);
        setNeedsConfig(true);
      } finally {
        setIsReady(true);
      }
    };

    init();
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={needsConfig ? 'ServerConfig' : 'Login'}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="ServerConfig"
          component={ServerConfigScreen}
          initialParams={{ isInitialSetup: needsConfig }}
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ShuttleSelection" component={ShuttleSelectionScreen} />
        <Stack.Screen name="RouteSelection" component={RouteSelectionScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="RouteTracking" component={RouteTrackingScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="Merchant" component={MerchantScreen} />
        <Stack.Screen name="UserDashboard" component={UserDashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#181D40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFD41C',
    fontSize: 16,
    fontWeight: '600',
  },
});
