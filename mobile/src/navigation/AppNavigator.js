// src/navigation/AppNavigator.js
// UPDATED: Added ShuttleSelection screen between Login and RouteSelection

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import ShuttleSelectionScreen from '../screens/ShuttleSelectionScreen';
import RouteSelectionScreen from '../screens/RouteSelectionScreen';
import PaymentScreen from '../screens/PaymentScreen';
import RouteTrackingScreen from '../screens/RouteTrackingScreen';
import ResultScreen from '../screens/ResultScreen';
import MerchantScreen from '../screens/MerchantScreen';
import UserDashboardScreen from '../screens/UserDashboardScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
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