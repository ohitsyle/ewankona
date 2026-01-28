// src/screens/RouteTrackingScreen.js
// FIXED: iOS Google Maps display issue
// - Added explicit provider check for iOS
// - Added map ready state handling

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Dimensions, 
  Platform, 
  ActivityIndicator,
  PermissionsAndroid 
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import api from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GOOGLE_MAPS_API_KEY } from '../config/api.config';

// Import react-native-maps
let MapView, Marker, Polyline, PROVIDER_GOOGLE;
let mapsAvailable = false;

try {
  const MapViewModule = require('react-native-maps');
  MapView = MapViewModule.default;
  Marker = MapViewModule.Marker;
  Polyline = MapViewModule.Polyline;
  PROVIDER_GOOGLE = MapViewModule.PROVIDER_GOOGLE;
  mapsAvailable = true;
  console.log('✅ React Native Maps loaded successfully');
} catch (error) {
  console.error('❌ Failed to load React Native Maps:', error);
}

const { width, height } = Dimensions.get('window');

export default function RouteTrackingScreen({ navigation, route }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationReady, setLocationReady] = useState(false);
  const [routeStarted, setRouteStarted] = useState(false);
  const [distanceToDestination, setDistanceToDestination] = useState(null);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [eta, setEta] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [heading, setHeading] = useState(0);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [error, setError] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('Initializing GPS...');
  const [startingLocation, setStartingLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [tripId, setTripId] = useState(null);

  const mapRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastLocationRef = useRef(null);
  const routeStartTimeRef = useRef(null);
  const locationTimeoutRef = useRef(null);

  // Get data from params
  const driverName = route.params?.name || 'Driver';
  const driverId = route.params?.driverId || '';
  const shuttleId = route.params?.shuttleId || 'SHUTTLE_01';
  const selectedRoute = route.params?.selectedRoute;
  const passengersBoarded = route.params?.passengersBoarded || [];
  const routeFare = route.params?.routeFare || selectedRoute?.fare || 15;

  useEffect(() => {
    if (!mapsAvailable || !selectedRoute) {
      setError('Maps not available or no route selected');
      return;
    }

    console.log('🚀 Route tracking screen opened');
    console.log('👥 Passengers:', passengersBoarded.length);
    console.log('🎯 Destination:', selectedRoute.destination?.name || selectedRoute.destinationName);
    console.log('📍 Acquiring GPS location...');
    console.log('🗺️ Platform:', Platform.OS);
    console.log('🗺️ PROVIDER_GOOGLE:', PROVIDER_GOOGLE);
    
    initLocation();
    
    return () => {
      console.log('🧹 Route tracking screen closed');
      stopLocationTracking();
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (startingLocation && routeStarted) {
      console.log('🗺️ Starting location and route started, fetching directions...');
      fetchDirections();
    }
  }, [startingLocation, routeStarted]);

  useEffect(() => {
    if (currentLocation && routeStarted && mapRef.current && mapReady) {
      try {
        mapRef.current.animateCamera({
          center: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          zoom: 16,
          heading: heading,
          pitch: 45,
        }, { duration: 500 });
        
        calculateDistance();
        
        if (lastLocationRef.current) {
          const distanceInc = calculateDistanceBetweenPoints(
            lastLocationRef.current.latitude,
            lastLocationRef.current.longitude,
            currentLocation.latitude,
            currentLocation.longitude
          );
          setDistanceTraveled(prev => prev + distanceInc);
        }
        lastLocationRef.current = currentLocation;
      } catch (err) {
        console.error('❌ Camera error:', err);
      }
    }
  }, [currentLocation, routeStarted, mapReady]);

  const onMapReady = () => {
    console.log('🗺️ Map is ready!');
    setMapReady(true);
  };

  const initLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      setHasLocationPermission(hasPermission);
      
      if (hasPermission) {
        startLocationTracking();
        
        locationTimeoutRef.current = setTimeout(() => {
          if (!locationReady) {
            console.log('⚠️ GPS timeout after 30 seconds');
            setError('GPS signal is weak. Please ensure GPS is enabled.');
          }
        }, 30000);
      } else {
        setError('Location permission denied');
      }
    } catch (err) {
      console.error('❌ Permission error:', err);
      setError('Failed to get location permission');
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    // iOS - permission is requested when Geolocation is used
    return true;
  };

  const startLocationTracking = () => {
    console.log('📍 Starting location tracking...');
    setGpsStatus('Searching for GPS signal...');

    // Get initial position
    Geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 Got initial position:', position.coords);
        handlePositionUpdate(position);
        setGpsStatus('GPS connected');
      },
      (err) => {
        console.log('⚠️ Initial position error:', err);
        setGpsStatus('Searching for GPS...');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    // Watch position
    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        handlePositionUpdate(position);
      },
      (err) => {
        console.log('⚠️ Watch position error:', err);
      },
      { enableHighAccuracy: true, distanceFilter: 5, interval: 3000 }
    );
  };

  const handlePositionUpdate = (position) => {
    const { latitude, longitude, heading: newHeading } = position.coords;

    setCurrentLocation({ latitude, longitude });
    setLocationReady(true);
    setError(null);

    if (newHeading !== null && newHeading !== undefined) {
      setHeading(newHeading);
    }

    if (!startingLocation) {
      setStartingLocation({ latitude, longitude });
    }

    // Clear timeout since we have GPS
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }

    // Send location to server continuously (even before route starts)
    // This allows admin to see shuttle position when it's "reserved"
    if (shuttleId) {
      console.log(`📡 Sending location to server: ${shuttleId} @ ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      api.post('/shuttle/updateLocation', {
        shuttleId,
        latitude,
        longitude,
        timestamp: new Date()
      }).then(() => {
        console.log('✅ Location sent successfully');
      }).catch(err => {
        console.error('❌ Failed to update location:', err.message);
        console.error('   Error details:', err.response?.data || err);
      });
    } else {
      console.log('⏸️ No shuttleId assigned, not sending location');
    }
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const fetchDirections = async () => {
    if (!startingLocation || !selectedRoute?.destination) return;

    setLoadingRoute(true);
    console.log('🗺️ Fetching directions from Google...');

    try {
      const origin = `${startingLocation.latitude},${startingLocation.longitude}`;
      const destination = `${selectedRoute.destination.latitude},${selectedRoute.destination.longitude}`;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);
        console.log('✅ Got route with', points.length, 'points');
        
        if (route.legs && route.legs[0]) {
          const duration = route.legs[0].duration.value / 60;
          setEta(Math.round(duration));
        }
      }
    } catch (err) {
      console.error('❌ Directions fetch error:', err);
    } finally {
      setLoadingRoute(false);
    }
  };

  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return points;
  };

  const calculateDistanceBetweenPoints = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateDistance = () => {
    if (!currentLocation || !selectedRoute?.destination) return;
    
    const dist = calculateDistanceBetweenPoints(
      currentLocation.latitude,
      currentLocation.longitude,
      selectedRoute.destination.latitude,
      selectedRoute.destination.longitude
    );
    setDistanceToDestination(dist);
  };

  const handleStartRoute = async () => {
    setRouteStarted(true);
    routeStartTimeRef.current = new Date();
    console.log('🚀 Route started at:', routeStartTimeRef.current);

    // Mark shuttle as 'taken' (route started)
    try {
      await api.post('/shuttles/start-route', {
        shuttleId,
        driverId
      });
      console.log('✅ Shuttle marked as taken');
    } catch (error) {
      console.error('❌ Failed to mark shuttle as taken:', error);
    }

    // Create trip record
    try {
      // Get destination coordinates with proper fallbacks
      const destCoords = getDestination();

      const response = await api.post('/trips/start', {
        shuttleId,
        driverId,
        routeId: selectedRoute?.routeId || selectedRoute?.name || 'ROUTE_01',
        startLatitude: startingLocation?.latitude || currentLocation?.latitude,
        startLongitude: startingLocation?.longitude || currentLocation?.longitude,
        startLocationName: selectedRoute?.origin?.name || selectedRoute?.originName || 'Start Location',
        endLatitude: destCoords.latitude,  // FIXED: Use getDestination() which always returns valid coords
        endLongitude: destCoords.longitude,  // FIXED: Use getDestination() which always returns valid coords
        endLocationName: destCoords.name
      });

      if (response.data?.tripId) {
        setTripId(response.data.tripId);
        console.log('✅ Trip created:', response.data.tripId);
      }
    } catch (error) {
      console.error('❌ Failed to create trip:', error);
    }
  };

  const handleEndRoute = async () => {
    Alert.alert(
      'End Route?',
      'Are you sure you want to end this route?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Route', 
          style: 'destructive',
          onPress: async () => {
            stopLocationTracking();

            // Calculate totals
            const totalFare = passengersBoarded.length * routeFare;
            const duration = routeStartTimeRef.current
              ? Math.round((new Date() - routeStartTimeRef.current) / 60000)
              : 0;

            // End trip if tripId exists
            if (tripId) {
              try {
                await api.put(`/trips/${tripId}/end`, {
                  passengerCount: passengersBoarded.length,
                  totalCollections: totalFare,
                  distanceTraveledKm: parseFloat(distanceTraveled.toFixed(2))
                });
                console.log('✅ Trip ended:', tripId);
              } catch (err) {
                console.error('❌ End trip API error:', err);
              }
            }

            // Call end-route API (releases shuttle)
            try {
              await api.post('/shuttle/end-route', {
                shuttleId,
                driverId,
                tripId,
                summary: {
                  passengers: passengersBoarded.length,
                  totalFare,
                  distance: distanceTraveled.toFixed(2),
                  duration
                }
              });
              console.log('✅ End route API called');
            } catch (err) {
              console.error('❌ End route API error:', err);
            }

            setShowSummary(true);
          }
        }
      ]
    );
  };

  const handleDone = () => {
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'ShuttleSelection',
        params: { driverId, name: driverName }
      }],
    });
  };

  const centerOnShuttle = () => {
    if (currentLocation && mapRef.current && mapReady) {
      mapRef.current.animateCamera({
        center: currentLocation,
        zoom: 17,
      }, { duration: 300 });
    }
  };

  // Get destination coordinates
  const getDestination = () => {
    if (selectedRoute?.destination) {
      return selectedRoute.destination;
    }
    // Return valid coordinates from route, with UP Diliman as ultimate fallback
    return {
      latitude: selectedRoute?.destinationLatitude || selectedRoute?.toLatitude || 14.2769,
      longitude: selectedRoute?.destinationLongitude || selectedRoute?.toLongitude || 121.0587,
      name: selectedRoute?.destinationName || selectedRoute?.toName || 'Destination'
    };
  };

  const destination = getDestination();

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Summary screen
  if (showSummary) {
    const totalFare = passengersBoarded.length * routeFare;
    const duration = routeStartTimeRef.current 
      ? Math.round((new Date() - routeStartTimeRef.current) / 60000)
      : 0;

    return (
      <SafeAreaView style={styles.summaryContainer}>
        <View style={styles.summaryContent}>
          <View style={styles.summaryIcon}>
            <Text style={styles.summaryIconText}>🏁</Text>
          </View>
          <Text style={styles.summaryTitle}>Route Complete!</Text>
          <Text style={styles.summaryRoute}>
            {selectedRoute?.shortName || selectedRoute?.name}
          </Text>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStatBox}>
              <Text style={styles.summaryStatNumber}>{passengersBoarded.length}</Text>
              <Text style={styles.summaryStatLabel}>Passengers</Text>
            </View>
            <View style={styles.summaryStatBox}>
              <Text style={styles.summaryStatNumber}>{distanceTraveled.toFixed(1)}</Text>
              <Text style={styles.summaryStatLabel}>km</Text>
            </View>
            <View style={styles.summaryStatBox}>
              <Text style={styles.summaryStatNumber}>{duration}</Text>
              <Text style={styles.summaryStatLabel}>min</Text>
            </View>
          </View>

          <View style={styles.summaryRevenue}>
            <Text style={styles.summaryRevenueLabel}>Total Collection</Text>
            <Text style={styles.summaryRevenueAmount}>₱{totalFare.toFixed(2)}</Text>
          </View>

          <TouchableOpacity style={styles.summaryDoneButton} onPress={handleDone}>
            <Text style={styles.summaryDoneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading GPS state
  if (!locationReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.gpsIcon}>
            <Text style={styles.gpsIconText}>📍</Text>
          </View>
          <ActivityIndicator size="large" color="#FFD41C" style={styles.spinner} />
          <Text style={styles.loadingTitle}>Acquiring GPS</Text>
          <Text style={styles.loadingText}>{gpsStatus}</Text>
          <Text style={styles.loadingHint}>Make sure GPS is enabled</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Ready to start (GPS acquired, route not started)
  if (!routeStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.readyContainer}>
          <View style={styles.readyIcon}>
            <Text style={styles.readyIconText}>✓</Text>
          </View>
          <Text style={styles.readyTitle}>GPS Ready</Text>
          <Text style={styles.readySubtitle}>Location acquired successfully</Text>

          <View style={styles.readyInfo}>
            <View style={styles.readyInfoRow}>
              <Text style={styles.readyInfoLabel}>Route:</Text>
              <Text style={styles.readyInfoValue} numberOfLines={1}>
                {selectedRoute?.shortName || selectedRoute?.name}
              </Text>
            </View>
            <View style={styles.readyInfoRow}>
              <Text style={styles.readyInfoLabel}>Shuttle:</Text>
              <Text style={styles.readyInfoValue}>{shuttleId}</Text>
            </View>
            <View style={styles.readyInfoRow}>
              <Text style={styles.readyInfoLabel}>Passengers:</Text>
              <Text style={styles.readyInfoValue}>{passengersBoarded.length}</Text>
            </View>
            <View style={styles.readyInfoRow}>
              <Text style={styles.readyInfoLabel}>Fare:</Text>
              <Text style={styles.readyInfoValue}>₱{routeFare}/person</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.beginButton} onPress={handleStartRoute}>
            <Text style={styles.beginButtonText}>🚀 Begin Route</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton2} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText2}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main map view
  console.log('🗺️ Rendering map...');

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        onMapReady={onMapReady}
        initialRegion={{
          latitude: currentLocation?.latitude || destination.latitude,
          longitude: currentLocation?.longitude || destination.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        loadingEnabled={true}
        loadingIndicatorColor="#FFD41C"
        loadingBackgroundColor="#181D40"
      >
        {/* Destination marker */}
        {mapReady && (
          <Marker coordinate={destination}>
            <View style={styles.destinationMarker}>
              <Text style={styles.markerText}>🎯</Text>
            </View>
          </Marker>
        )}

        {/* Shuttle location marker */}
        {mapReady && currentLocation && (
          <Marker 
            coordinate={currentLocation} 
            anchor={{ x: 0.5, y: 0.5 }} 
            rotation={heading}
          >
            <View style={styles.shuttleMarker}>
              <Text style={styles.shuttleIcon}>🚐</Text>
            </View>
          </Marker>
        )}

        {/* Route polyline */}
        {mapReady && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#00D4FF"
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {loadingRoute && (
        <View style={styles.loadingRouteOverlay}>
          <ActivityIndicator size="large" color="#FFD41C" />
          <Text style={styles.loadingRouteText}>Loading route...</Text>
        </View>
      )}

      {/* Top info card */}
      <View style={styles.topCard}>
        <View style={styles.routeHeader}>
          <View style={styles.routeHeaderLeft}>
            <Text style={styles.routeTitle} numberOfLines={1}>
              {selectedRoute?.shortName || selectedRoute?.name}
            </Text>
            <Text style={styles.shuttleInfo}>Shuttle: {shuttleId}</Text>
          </View>
          <View style={styles.activeIndicator}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>ACTIVE</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {distanceToDestination ? `${distanceToDestination.toFixed(1)} km` : '-- km'}
            </Text>
            <Text style={styles.statLabel}>To Destination</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{eta ? `${eta} min` : '-- min'}</Text>
            <Text style={styles.statLabel}>ETA</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{passengersBoarded.length}</Text>
            <Text style={styles.statLabel}>Passengers</Text>
          </View>
        </View>
      </View>

      {/* Bottom card */}
      <View style={styles.bottomCard}>
        <View style={styles.destinationBox}>
          <Text style={styles.destinationLabel}>Destination</Text>
          <Text style={styles.destinationText} numberOfLines={1}>
            {destination.name}
          </Text>
        </View>
        <TouchableOpacity style={styles.endButton} onPress={handleEndRoute}>
          <Text style={styles.endButtonText}>🏁 End Route</Text>
        </TouchableOpacity>
      </View>

      {/* Center button */}
      {currentLocation && (
        <TouchableOpacity style={styles.centerButton} onPress={centerOnShuttle}>
          <Text style={styles.centerButtonText}>📍</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#181D40' },
  map: { width: width, height: height },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  gpsIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#35408E', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  gpsIconText: { fontSize: 50 },
  spinner: { marginVertical: 20 },
  loadingTitle: { fontSize: 24, fontWeight: '700', color: '#FFD41C', marginBottom: 10, textAlign: 'center' },
  loadingText: { fontSize: 16, color: '#FBFBFB', opacity: 0.8, textAlign: 'center', marginBottom: 8 },
  loadingHint: { fontSize: 14, color: '#FBFBFB', opacity: 0.6, marginBottom: 30, textAlign: 'center' },
  cancelButton: { backgroundColor: '#1E1E1E', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12, borderWidth: 2, borderColor: '#35408E' },
  cancelButtonText: { fontSize: 16, color: '#FBFBFB', fontWeight: '600' },
  readyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  readyIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  readyIconText: { fontSize: 50, color: '#FBFBFB' },
  readyTitle: { fontSize: 32, fontWeight: '700', color: '#10B981', marginBottom: 5 },
  readySubtitle: { fontSize: 16, color: '#FBFBFB', opacity: 0.7, marginBottom: 25 },
  readyInfo: { width: '100%', backgroundColor: '#1E1E1E', borderRadius: 20, padding: 25, marginBottom: 25, borderWidth: 2, borderColor: '#35408E' },
  readyInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  readyInfoLabel: { fontSize: 16, color: '#FBFBFB', opacity: 0.7 },
  readyInfoValue: { fontSize: 16, color: '#FFD41C', fontWeight: '700', flex: 1, textAlign: 'right' },
  beginButton: { width: '100%', backgroundColor: '#10B981', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 15, shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  beginButtonText: { fontSize: 20, color: '#FBFBFB', fontWeight: '700' },
  backButton2: { paddingVertical: 12 },
  backButtonText2: { fontSize: 16, color: '#FBFBFB', opacity: 0.7 },
  summaryContainer: { flex: 1, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', padding: 20 },
  summaryContent: { width: '100%', alignItems: 'center' },
  summaryIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  summaryIconText: { fontSize: 60 },
  summaryTitle: { fontSize: 32, fontWeight: '700', color: '#FBFBFB', marginBottom: 10 },
  summaryRoute: { fontSize: 18, color: '#FBFBFB', opacity: 0.9, marginBottom: 40, textAlign: 'center' },
  summaryStats: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  summaryStatBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 15, padding: 20, marginHorizontal: 5, alignItems: 'center' },
  summaryStatNumber: { fontSize: 28, fontWeight: '700', color: '#FBFBFB', marginBottom: 5 },
  summaryStatLabel: { fontSize: 12, color: '#FBFBFB', opacity: 0.8 },
  summaryRevenue: { width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 25, marginBottom: 30, alignItems: 'center' },
  summaryRevenueLabel: { fontSize: 14, color: '#FBFBFB', marginBottom: 8, opacity: 0.8 },
  summaryRevenueAmount: { fontSize: 42, fontWeight: '700', color: '#FFD41C' },
  summaryDoneButton: { width: '100%', backgroundColor: '#FBFBFB', paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
  summaryDoneButtonText: { color: '#10B981', fontSize: 18, fontWeight: '700' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorIcon: { fontSize: 60, marginBottom: 20 },
  errorTitle: { fontSize: 24, fontWeight: '700', color: '#FBFBFB', marginBottom: 10 },
  errorText: { fontSize: 16, color: '#FBFBFB', textAlign: 'center', opacity: 0.7, marginBottom: 30 },
  errorButton: { backgroundColor: '#FFD41C', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 },
  errorButtonText: { fontSize: 18, fontWeight: '700', color: '#181D40' },
  destinationMarker: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FBFBFB' },
  markerText: { fontSize: 28 },
  shuttleMarker: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFD41C', borderRadius: 25, borderWidth: 3, borderColor: '#FBFBFB' },
  shuttleIcon: { fontSize: 28 },
  topCard: { position: 'absolute', top: 60, left: 20, right: 20, backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20, borderWidth: 2, borderColor: '#35408E' },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  routeHeaderLeft: { flex: 1, marginRight: 10 },
  routeTitle: { fontSize: 16, fontWeight: '700', color: '#FFD41C', marginBottom: 5 },
  shuttleInfo: { fontSize: 13, color: '#FBFBFB', opacity: 0.7 },
  activeIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FBFBFB', marginRight: 6 },
  activeText: { fontSize: 12, color: '#FBFBFB', fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#35408E', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#FFD41C', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#FBFBFB', opacity: 0.7, textAlign: 'center' },
  bottomCard: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20, borderWidth: 2, borderColor: '#35408E' },
  destinationBox: { backgroundColor: '#35408E', padding: 15, borderRadius: 12, marginBottom: 15 },
  destinationLabel: { fontSize: 12, color: '#FBFBFB', opacity: 0.7, marginBottom: 5 },
  destinationText: { fontSize: 16, color: '#FFD41C', fontWeight: '700' },
  endButton: { backgroundColor: '#EF4444', paddingVertical: 16, borderRadius: 15, alignItems: 'center' },
  endButtonText: { color: '#FBFBFB', fontSize: 18, fontWeight: '700' },
  centerButton: { position: 'absolute', right: 20, bottom: 240, width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFD41C', alignItems: 'center', justifyContent: 'center' },
  centerButtonText: { fontSize: 24 },
  loadingRouteOverlay: { position: 'absolute', top: '50%', left: '50%', marginLeft: -75, marginTop: -50, backgroundColor: '#1E1E1E', padding: 20, borderRadius: 15, alignItems: 'center', borderWidth: 2, borderColor: '#35408E' },
  loadingRouteText: { color: '#FBFBFB', marginTop: 10, fontSize: 14 },
});