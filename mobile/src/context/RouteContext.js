// src/context/RouteContext.js
// Shared state for route tracking and passenger counting

import React, { createContext, useContext, useState } from 'react';

const RouteContext = createContext();

export const RouteProvider = ({ children }) => {
  const [routeActive, setRouteActive] = useState(false);
  const [passengers, setPassengers] = useState([]);
  const [routeData, setRouteData] = useState(null);

  const startRoute = (route) => {
    setRouteActive(true);
    setPassengers([]);
    setRouteData(route);
    console.log('✅ Route started:', route);
  };

  const endRoute = () => {
    const summary = {
      passengerCount: passengers.length,
      passengers: [...passengers],
      route: routeData
    };
    
    setRouteActive(false);
    setPassengers([]);
    setRouteData(null);
    
    console.log('🏁 Route ended:', summary);
    return summary;
  };

  const addPassenger = (passenger) => {
    if (routeActive) {
      setPassengers(prev => [...prev, passenger]);
      console.log('✅ Passenger added:', passenger.name);
      console.log('📊 Total passengers:', passengers.length + 1);
      return true;
    }
    console.log('⚠️ Cannot add passenger - route not active');
    return false;
  };

  const getPassengerCount = () => passengers.length;

  return (
    <RouteContext.Provider
      value={{
        routeActive,
        passengers,
        routeData,
        startRoute,
        endRoute,
        addPassenger,
        getPassengerCount
      }}
    >
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error('useRoute must be used within RouteProvider');
  }
  return context;
};