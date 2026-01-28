// src/admin/components/Routes/RoutesList.jsx
// Interactive map-based route creation with step-by-step wizard
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import SearchBar from '../common/SearchBar';
import ExportButton from '../common/ExportButton';
import { exportToCSV, prepareDataForExport } from '../../utils/csvExport';

// Single Location Map Picker Component
function LocationMapPicker({ location, onLocationChange, onConfirm, pointLabel, pointColor, apiKey }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [tempLocation, setTempLocation] = useState(location);
  const [displayName, setDisplayName] = useState(location.displayName || '');

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    // Initialize map centered on Manila
    const map = new window.google.maps.Map(mapRef.current, {
      center: location.latitude && location.longitude
        ? { lat: location.latitude, lng: location.longitude }
        : { lat: 14.5995, lng: 120.9842 },
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true
    });

    mapInstanceRef.current = map;
    setIsMapReady(true);

    // Initialize marker
    const iconColor = pointColor === 'green' ? 'green-dot' : 'red-dot';
    markerRef.current = new window.google.maps.Marker({
      map,
      draggable: true,
      label: pointLabel,
      title: `Point ${pointLabel}`,
      icon: {
        url: `http://maps.google.com/mapfiles/ms/icons/${iconColor}.png`
      },
      position: location.latitude && location.longitude
        ? { lat: location.latitude, lng: location.longitude }
        : map.getCenter()
    });

    // Handle marker drag
    markerRef.current.addListener('dragend', async (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      // Reverse geocode to get place name
      const geocoder = new window.google.maps.Geocoder();
      try {
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results[0]) {
          setTempLocation({
            name: response.results[0].formatted_address,
            latitude: lat,
            longitude: lng
          });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        setTempLocation({
          name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          latitude: lat,
          longitude: lng
        });
      }
    });

    return () => {
      if (markerRef.current) markerRef.current.setMap(null);
    };
  }, []);

  // Update marker position when location changes
  useEffect(() => {
    if (markerRef.current && tempLocation.latitude && tempLocation.longitude) {
      const pos = { lat: tempLocation.latitude, lng: tempLocation.longitude };
      markerRef.current.setPosition(pos);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(pos);
      }
    }
  }, [tempLocation]);

  // Initialize autocomplete (more reliable than SearchBox)
  useEffect(() => {
    if (!isMapReady || !window.google?.maps?.places || !searchInputRef.current) {
      console.log('Autocomplete not ready:', { isMapReady, hasGoogle: !!window.google?.maps?.places, hasInput: !!searchInputRef.current });
      return;
    }

    console.log('Initializing Autocomplete...');

    // Create autocomplete with Philippines bias
    const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      componentRestrictions: { country: 'ph' }, // Restrict to Philippines
      fields: ['formatted_address', 'geometry', 'name'],
      types: ['establishment', 'geocode'] // Allow both places and addresses
    });

    autocompleteRef.current = autocomplete;

    // Bias results to map viewport
    autocomplete.bindTo('bounds', mapInstanceRef.current);

    // Add focus listener to help debugging
    searchInputRef.current.addEventListener('focus', () => {
      console.log('Search input focused - autocomplete should show suggestions when typing');
    });

    const placeChangedListener = autocomplete.addListener('place_changed', () => {
      console.log('Place changed triggered');
      const place = autocomplete.getPlace();
      console.log('Selected place:', place);

      if (!place.geometry) {
        console.warn('No geometry for place');
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      console.log('Coordinates:', lat, lng);

      setTempLocation({
        name: place.formatted_address,
        latitude: lat,
        longitude: lng
      });
      setDisplayName(place.name || ''); // Set short name
    });

    // Cleanup
    return () => {
      if (placeChangedListener) {
        window.google.maps.event.removeListener(placeChangedListener);
      }
    };
  }, [isMapReady]);

  return (
    <div>
      {/* Google Places Autocomplete Styles - CRITICAL for dropdown visibility */}
      <style>{`
        .pac-container {
          background-color: #1E2347 !important;
          border: 2px solid #FFD41C !important;
          border-radius: 8px !important;
          margin-top: 4px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
          z-index: 10000 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        .pac-item {
          padding: 10px 12px !important;
          cursor: pointer !important;
          border-top: 1px solid rgba(255,212,28,0.2) !important;
          color: rgba(251,251,251,0.9) !important;
          font-size: 14px !important;
        }
        .pac-item:first-child {
          border-top: none !important;
        }
        .pac-item:hover {
          background-color: rgba(255,212,28,0.1) !important;
        }
        .pac-item-selected {
          background-color: rgba(255,212,28,0.15) !important;
        }
        .pac-item-query {
          color: #FFD41C !important;
          font-size: 14px !important;
        }
        .pac-matched {
          font-weight: 700 !important;
          color: #FFD41C !important;
        }
        .pac-icon {
          display: none !important;
        }
      `}</style>

      {/* Search Box */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          color: '#FFD41C',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          {pointLabel === 'A' ? '🅰️ Search Starting Location' : '🅱️ Search Destination'}
        </label>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Type location name or address..."
          style={{
            width: '100%',
            padding: '12px',
            border: `2px solid ${pointColor === 'green' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: '8px',
            background: 'rgba(251,251,251,0.05)',
            color: 'rgba(251,251,251,0.9)',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginTop: '4px' }}>
          Start typing and select from dropdown suggestions
        </div>
      </div>

      {/* Display Name Input */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          color: '#FFD41C',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          Display Name (shown in app)
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g., National University, Manila"
          style={{
            width: '100%',
            padding: '12px',
            border: `2px solid ${pointColor === 'green' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: '8px',
            background: 'rgba(251,251,251,0.05)',
            color: 'rgba(251,251,251,0.9)',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginTop: '4px' }}>
          Short, readable name for users (instead of full address)
        </div>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '12px',
          border: '2px solid rgba(255,212,28,0.3)',
          overflow: 'hidden',
          marginBottom: '16px'
        }}
      />

      {/* Selected Location Display */}
      {tempLocation.name && (
        <div style={{
          padding: '12px',
          background: `${pointColor === 'green' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}`,
          border: `1px solid ${pointColor === 'green' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '12px', color: 'rgba(251,251,251,0.6)', marginBottom: '4px' }}>
            Selected Location:
          </div>
          <div style={{
            fontSize: '14px',
            color: pointColor === 'green' ? '#22C55E' : '#EF4444',
            fontWeight: 600
          }}>
            ✓ {displayName || tempLocation.name}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginTop: '4px' }}>
            Full address: {tempLocation.name}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginTop: '2px' }}>
            Coordinates: {tempLocation.latitude?.toFixed(6)}, {tempLocation.longitude?.toFixed(6)}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        padding: '12px',
        background: 'rgba(255,212,28,0.1)',
        border: '1px solid rgba(255,212,28,0.3)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'rgba(251,251,251,0.7)',
        marginBottom: '24px'
      }}>
        💡 <strong>Tip:</strong> Search for a location above or drag the {pointLabel === 'A' ? '🅰️ green' : '🅱️ red'} marker on the map to adjust position precisely.
      </div>

      {/* Confirm Button */}
      <button
        onClick={() => onConfirm({ ...tempLocation, displayName: displayName || tempLocation.name })}
        disabled={!tempLocation.name || !tempLocation.latitude || !displayName}
        style={{
          width: '100%',
          padding: '14px',
          background: (!tempLocation.name || !tempLocation.latitude || !displayName)
            ? 'rgba(100,100,100,0.2)'
            : 'linear-gradient(135deg, #FFD41C 0%, #FFA500 100%)',
          color: (!tempLocation.name || !tempLocation.latitude || !displayName)
            ? 'rgba(251,251,251,0.3)'
            : '#1E2347',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: 700,
          cursor: (!tempLocation.name || !tempLocation.latitude || !displayName) ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s'
        }}
      >
        {pointLabel === 'A' ? 'Set Point A & Continue →' : 'Set Point B & Continue →'}
      </button>
    </div>
  );
}

export default function RoutesList() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: Point A, 2: Point B, 3: Route Details, 4: Summary
  const [editingRoute, setEditingRoute] = useState(null);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Form data
  const [fromLocation, setFromLocation] = useState({ name: '', displayName: '', latitude: null, longitude: null });
  const [toLocation, setToLocation] = useState({ name: '', displayName: '', latitude: null, longitude: null });
  const [fare, setFare] = useState(15);
  const [active, setActive] = useState(true);
  const [createReverse, setCreateReverse] = useState(true);

  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyBOFPwkdS8TKEe3I2QUDBFWq_q3On5kDBI';
  const [googleMapsReady, setGoogleMapsReady] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('✅ Google Maps already loaded and ready');
      setGoogleMapsReady(true);
      return;
    }

    // Define global callback BEFORE adding script
    window.initGoogleMaps = () => {
      console.log('✅ Google Maps API loaded via callback');
      setGoogleMapsReady(true);
      // Don't delete - might be needed for multiple component mounts
    };

    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      console.log('⏳ Google Maps script already in DOM, waiting for load...');
      console.log('Script src:', existingScript.src);

      // Check periodically with timeout
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('✅ Google Maps API ready after', attempts * 100, 'ms');
          setGoogleMapsReady(true);
          clearInterval(checkInterval);
        } else if (attempts >= maxAttempts) {
          console.error('❌ Timeout waiting for Google Maps API to load');
          console.error('Check browser console for Google Maps errors');
          clearInterval(checkInterval);
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }

    console.log('📍 Loading Google Maps script with key:', GOOGLE_MAPS_API_KEY.substring(0, 20) + '...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('Script loaded, waiting for callback...');
    };

    script.onerror = (error) => {
      console.error('❌ Failed to load Google Maps script:', error);
      console.error('Possible causes: Invalid API key, network issue, or API restrictions');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
    };
  }, [GOOGLE_MAPS_API_KEY]);

  const loadRoutes = async () => {
    try {
      const data = await api.get('/admin/routes');
      setRoutes(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading routes:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
    const interval = setInterval(loadRoutes, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const getNextRouteId = () => {
    if (routes.length === 0) return 'ROUTE_001';

    let highestNum = 0;
    for (const route of routes) {
      if (route.routeId) {
        const match = route.routeId.match(/ROUTE_(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > highestNum) highestNum = num;
        }
      }
    }

    return `ROUTE_${String(highestNum + 1).padStart(3, '0')}`;
  };

  const handleSubmit = async () => {
    try {
      const routeName = `${fromLocation.displayName || fromLocation.name} → ${toLocation.displayName || toLocation.name}`;
      const payload = {
        routeName,
        fromName: fromLocation.displayName || fromLocation.name,
        fromLatitude: fromLocation.latitude,
        fromLongitude: fromLocation.longitude,
        toName: toLocation.displayName || toLocation.name,
        toLatitude: toLocation.latitude,
        toLongitude: toLocation.longitude,
        fare: parseFloat(fare),
        isActive: active
      };

      if (editingRoute) {
        await api.put(`/admin/routes/${editingRoute._id}`, payload);
        setAlert({ type: 'success', message: 'Route updated successfully!' });
      } else {
        const newRouteId = getNextRouteId();
        await api.post('/admin/routes', { ...payload, routeId: newRouteId });

        if (createReverse) {
          // Get next route ID for reverse route
          const reverseRouteId = `ROUTE_${String(parseInt(newRouteId.split('_')[1]) + 1).padStart(3, '0')}`;
          const reversePayload = {
            routeId: reverseRouteId,
            routeName: `${toLocation.displayName || toLocation.name} → ${fromLocation.displayName || fromLocation.name}`,
            fromName: toLocation.displayName || toLocation.name,
            fromLatitude: toLocation.latitude,
            fromLongitude: toLocation.longitude,
            toName: fromLocation.displayName || fromLocation.name,
            toLatitude: fromLocation.latitude,
            toLongitude: fromLocation.longitude,
            fare: parseFloat(fare),
            isActive: active
          };
          await api.post('/admin/routes', reversePayload);
          setAlert({ type: 'success', message: 'Route and reverse route created successfully! 🎉' });
        } else {
          setAlert({ type: 'success', message: 'Route created successfully! 🎉' });
        }
      }

      resetForm();
      setShowModal(false);
      loadRoutes();
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to save route' });
    }
  };

  const resetForm = () => {
    setFromLocation({ name: '', displayName: '', latitude: null, longitude: null });
    setToLocation({ name: '', displayName: '', latitude: null, longitude: null });
    setFare(15);
    setActive(true);
    setEditingRoute(null);
    setCreateReverse(true);
    setModalStep(1);
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFromLocation({
      name: route.fromName,
      displayName: route.fromName,
      latitude: route.fromLatitude,
      longitude: route.fromLongitude
    });
    setToLocation({
      name: route.toName,
      displayName: route.toName,
      latitude: route.toLatitude,
      longitude: route.toLongitude
    });
    setFare(route.fare);
    setActive(route.isActive);
    setModalStep(3); // Skip to details step when editing
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      await api.delete(`/admin/routes/${id}`);
      setAlert({ type: 'success', message: 'Route deleted successfully!' });
      loadRoutes();
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to delete route' });
    }
  };

  const handleExport = () => {
    const exportData = prepareDataForExport(routes, [
      'routeId', 'routeName', 'fromName', 'toName', 'fare', 'isActive'
    ]);
    exportToCSV(exportData, `routes_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const filteredRoutes = routes.filter(route =>
    route.routeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.fromName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.toName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.routeId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRoutes = filteredRoutes.slice(startIndex, endIndex);

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Alert */}
      {alert && (
        <div style={{
          padding: '16px 20px',
          marginBottom: '24px',
          borderRadius: '12px',
          background: alert.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
          border: `2px solid ${alert.type === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
          color: alert.type === 'success' ? '#22C55E' : '#EF4444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{alert.message}</span>
          <button
            onClick={() => setAlert(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '0 8px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#FFD41C', fontSize: '28px' }}>🗺️ Routes</h2>
          <p style={{ margin: '4px 0 0 0', color: 'rgba(251,251,251,0.6)', fontSize: '14px' }}>
            Manage shuttle routes with interactive map
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <ExportButton onClick={handleExport} />
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #FFD41C 0%, #FFA500 100%)',
              color: '#1E2347',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + Add Route
          </button>
        </div>
      </div>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search routes..."
      />

      {/* Routes Table */}
      <div style={{
        flex: 1,
        background: 'rgba(30,35,71,0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(255,212,28,0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#1E2347', zIndex: 1 }}>
              <tr>
                <th style={headerStyle}>Route ID</th>
                <th style={headerStyle}>Route Name</th>
                <th style={headerStyle}>From</th>
                <th style={headerStyle}>To</th>
                <th style={headerStyle}>Fare</th>
                <th style={headerStyle}>Status</th>
                <th style={headerStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'rgba(251,251,251,0.5)' }}>
                    Loading routes...
                  </td>
                </tr>
              ) : currentRoutes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'rgba(251,251,251,0.5)' }}>
                    No routes found
                  </td>
                </tr>
              ) : (
                currentRoutes.map((route) => (
                  <tr key={route._id} style={{ borderBottom: '1px solid rgba(255,212,28,0.1)' }}>
                    <td style={cellStyle}>{route.routeId}</td>
                    <td style={cellStyle}>{route.routeName}</td>
                    <td style={cellStyle}>{route.fromName}</td>
                    <td style={cellStyle}>{route.toName}</td>
                    <td style={cellStyle}>₱{route.fare}</td>
                    <td style={cellStyle}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: route.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(100,100,100,0.2)',
                        color: route.isActive ? '#22C55E' : 'rgba(251,251,251,0.5)'
                      }}>
                        {route.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(route)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(59,130,246,0.2)',
                            color: '#3B82F6',
                            border: '1px solid rgba(59,130,246,0.3)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(route._id)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(239,68,68,0.2)',
                            color: '#EF4444',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              background: currentPage === 1 ? 'rgba(100,100,100,0.2)' : 'rgba(255,212,28,0.2)',
              color: currentPage === 1 ? 'rgba(251,251,251,0.3)' : '#FFD41C',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            ← Previous
          </button>
          <span style={{ color: 'rgba(251,251,251,0.7)', fontSize: '14px' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 16px',
              background: currentPage === totalPages ? 'rgba(100,100,100,0.2)' : 'rgba(255,212,28,0.2)',
              color: currentPage === totalPages ? 'rgba(251,251,251,0.3)' : '#FFD41C',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Modal - Step by Step Wizard */}
      {showModal && (
        <div
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1E2347',
              borderRadius: '16px',
              border: '2px solid rgba(255,212,28,0.3)',
              width: '100%',
              maxWidth: '700px',
              maxHeight: '90vh',
              overflowY: 'auto',
              overflowX: 'visible', // Allow autocomplete dropdown to overflow
              padding: '32px',
              position: 'relative'
            }}
          >
            {/* Header with Progress */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#FFD41C', fontSize: '24px' }}>
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </h3>

              {/* Progress Steps */}
              {!editingRoute && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      style={{
                        flex: 1,
                        height: '4px',
                        background: step <= modalStep ? '#FFD41C' : 'rgba(255,212,28,0.2)',
                        borderRadius: '2px',
                        transition: 'all 0.3s'
                      }}
                    />
                  ))}
                </div>
              )}

              <div style={{ fontSize: '13px', color: 'rgba(251,251,251,0.6)' }}>
                {!editingRoute && (
                  <>
                    {modalStep === 1 && 'Step 1 of 4: Set Starting Point'}
                    {modalStep === 2 && 'Step 2 of 4: Set Destination'}
                    {modalStep === 3 && 'Step 3 of 4: Route Details'}
                    {modalStep === 4 && 'Step 4 of 4: Review & Confirm'}
                  </>
                )}
              </div>
            </div>

            {/* Step 1: Point A */}
            {modalStep === 1 && !editingRoute && (
              <LocationMapPicker
                location={fromLocation}
                onLocationChange={setFromLocation}
                onConfirm={(loc) => {
                  setFromLocation(loc);
                  setModalStep(2);
                }}
                pointLabel="A"
                pointColor="green"
                apiKey={GOOGLE_MAPS_API_KEY}
              />
            )}

            {/* Step 2: Point B */}
            {modalStep === 2 && !editingRoute && (
              <div>
                <LocationMapPicker
                  location={toLocation}
                  onLocationChange={setToLocation}
                  onConfirm={(loc) => {
                    setToLocation(loc);
                    setModalStep(3);
                  }}
                  pointLabel="B"
                  pointColor="red"
                  apiKey={GOOGLE_MAPS_API_KEY}
                />

                {/* Back Button */}
                <button
                  onClick={() => setModalStep(1)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(100,100,100,0.2)',
                    color: 'rgba(251,251,251,0.7)',
                    border: '1px solid rgba(100,100,100,0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    marginTop: '12px'
                  }}
                >
                  ← Back to Point A
                </button>
              </div>
            )}

            {/* Step 3: Route Details */}
            {modalStep === 3 && (
              <div>
                {/* Selected Locations Summary */}
                <div style={{
                  background: 'rgba(255,212,28,0.1)',
                  border: '1px solid rgba(255,212,28,0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{ fontSize: '13px', color: 'rgba(251,251,251,0.6)', marginBottom: '12px' }}>
                    Selected Route:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: '#22C55E', marginBottom: '4px' }}>🅰️ FROM</div>
                      <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontWeight: 600 }}>
                        {fromLocation.displayName || fromLocation.name}
                      </div>
                    </div>
                    <div style={{ fontSize: '20px', color: '#FFD41C' }}>→</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: '#EF4444', marginBottom: '4px' }}>🅱️ TO</div>
                      <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontWeight: 600 }}>
                        {toLocation.displayName || toLocation.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fare and Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#FFD41C', fontWeight: 600, fontSize: '14px' }}>
                      Fare (₱)
                    </label>
                    <input
                      type="number"
                      value={fare}
                      onChange={(e) => setFare(e.target.value)}
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid rgba(255,212,28,0.3)',
                        borderRadius: '8px',
                        background: 'rgba(251,251,251,0.05)',
                        color: 'rgba(251,251,251,0.9)',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#FFD41C', fontWeight: 600, fontSize: '14px' }}>
                      Status
                    </label>
                    <select
                      value={active ? 'true' : 'false'}
                      onChange={(e) => setActive(e.target.value === 'true')}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid rgba(255,212,28,0.3)',
                        borderRadius: '8px',
                        background: 'rgba(251,251,251,0.05)',
                        color: 'rgba(251,251,251,0.9)',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Auto-create reverse route checkbox */}
                {!editingRoute && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      padding: '14px',
                      background: 'rgba(59,130,246,0.1)',
                      border: '1px solid rgba(59,130,246,0.3)',
                      borderRadius: '8px'
                    }}>
                      <input
                        type="checkbox"
                        checked={createReverse}
                        onChange={(e) => setCreateReverse(e.target.checked)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'rgba(251,251,251,0.9)', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                          🔄 Create Reverse Route
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(251,251,251,0.6)' }}>
                          Automatically create: {toLocation.displayName || toLocation.name || 'Point B'} → {fromLocation.displayName || fromLocation.name || 'Point A'}
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  {!editingRoute && (
                    <button
                      onClick={() => setModalStep(2)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'rgba(100,100,100,0.2)',
                        color: 'rgba(251,251,251,0.7)',
                        border: '1px solid rgba(100,100,100,0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      ← Back
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (editingRoute) {
                        handleSubmit();
                      } else {
                        setModalStep(4);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'linear-gradient(135deg, #FFD41C 0%, #FFA500 100%)',
                      color: '#1E2347',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    {editingRoute ? 'Update Route' : 'Review →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {modalStep === 4 && !editingRoute && (
              <div>
                <div style={{
                  background: 'rgba(255,212,28,0.05)',
                  border: '2px solid rgba(255,212,28,0.3)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#FFD41C', fontSize: '18px' }}>
                    ✓ Route Summary
                  </h4>

                  {/* Route Details */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(251,251,251,0.5)', marginBottom: '8px' }}>
                      Main Route:
                    </div>
                    <div style={{
                      background: 'rgba(251,251,251,0.05)',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#22C55E', marginBottom: '4px' }}>🅰️ FROM</div>
                          <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontWeight: 600 }}>
                            {fromLocation.displayName || fromLocation.name}
                          </div>
                        </div>
                        <div style={{ fontSize: '20px', color: '#FFD41C' }}>→</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#EF4444', marginBottom: '4px' }}>🅱️ TO</div>
                          <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontWeight: 600 }}>
                            {toLocation.displayName || toLocation.name}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255,212,28,0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '13px'
                      }}>
                        <div style={{ color: 'rgba(251,251,251,0.6)' }}>
                          Fare: <span style={{ color: '#FFD41C', fontWeight: 600 }}>₱{fare}</span>
                        </div>
                        <div style={{ color: 'rgba(251,251,251,0.6)' }}>
                          Status: <span style={{ color: active ? '#22C55E' : 'rgba(251,251,251,0.5)', fontWeight: 600 }}>
                            {active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reverse Route Preview */}
                  {createReverse && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'rgba(251,251,251,0.5)', marginBottom: '8px' }}>
                        Reverse Route (Auto-created):
                      </div>
                      <div style={{
                        background: 'rgba(59,130,246,0.1)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(59,130,246,0.3)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: '#EF4444', marginBottom: '4px' }}>🅱️ FROM</div>
                            <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontWeight: 600 }}>
                              {toLocation.displayName || toLocation.name}
                            </div>
                          </div>
                          <div style={{ fontSize: '20px', color: '#3B82F6' }}>→</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: '#22C55E', marginBottom: '4px' }}>🅰️ TO</div>
                            <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontWeight: 600 }}>
                              {fromLocation.displayName || fromLocation.name}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          paddingTop: '12px',
                          borderTop: '1px solid rgba(59,130,246,0.2)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px'
                        }}>
                          <div style={{ color: 'rgba(251,251,251,0.6)' }}>
                            Fare: <span style={{ color: '#3B82F6', fontWeight: 600 }}>₱{fare}</span>
                          </div>
                          <div style={{ color: 'rgba(251,251,251,0.6)' }}>
                            Status: <span style={{ color: active ? '#22C55E' : 'rgba(251,251,251,0.5)', fontWeight: 600 }}>
                              {active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setModalStep(3)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(100,100,100,0.2)',
                      color: 'rgba(251,251,251,0.7)',
                      border: '1px solid rgba(100,100,100,0.3)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    ← Back to Edit
                  </button>
                  <button
                    onClick={handleSubmit}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '15px'
                    }}
                  >
                    {createReverse ? '✓ Create Both Routes' : '✓ Create Route'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const headerStyle = {
  padding: '16px',
  textAlign: 'left',
  color: '#FFD41C',
  fontWeight: 700,
  fontSize: '13px',
  borderBottom: '2px solid rgba(255,212,28,0.3)',
  whiteSpace: 'nowrap'
};

const cellStyle = {
  padding: '16px',
  color: 'rgba(251,251,251,0.8)',
  fontSize: '14px'
};
