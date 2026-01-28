// src/admin/components/Routes/RoutesList.jsx
// Interactive map-based route creation with step-by-step wizard
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import SearchBar from '../../../components/shared/SearchBar';
import ExportButton from '../../../components/shared/ExportButton';
import Alert from '../../../components/shared/Alert';
import { exportToCSV, prepareDataForExport } from '../../../utils/csvExport';

// Single Location Map Picker Component
function LocationMapPicker({ location, onLocationChange, onConfirm, pointLabel, pointColor, apiKey }) {
  const { theme, isDarkMode } = useTheme();
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
      <div className="mb-4">
        <label className="block mb-2 font-semibold text-sm" style={{ color: theme.accent.primary }}>
          {pointLabel === 'A' ? '🅰️ Search Starting Location' : '🅱️ Search Destination'}
        </label>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Type location name or address..."
          className={`w-full p-3 border-2 rounded-lg text-sm box-border`}
          style={{
            borderColor: pointColor === 'green' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
            background: 'rgba(251,251,251,0.05)',
            color: theme.text.primary
          }}
        />
        <div className="text-[11px] mt-1" style={{ color: theme.text.secondary }}>
          Start typing and select from dropdown suggestions
        </div>
      </div>

      {/* Display Name Input */}
      <div className="mb-4">
        <label className="block mb-2 font-semibold text-sm" style={{ color: theme.accent.primary }}>
          Display Name (shown in app)
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g., National University, Manila"
          className="w-full p-3 border-2 rounded-lg text-sm box-border"
          style={{
            borderColor: pointColor === 'green' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
            background: 'rgba(251,251,251,0.05)',
            color: theme.text.primary
          }}
        />
        <div className="text-[11px] mt-1" style={{ color: theme.text.secondary }}>
          Short, readable name for users (instead of full address)
        </div>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="w-full h-[400px] rounded-xl border-2 border-[rgba(255,212,28,0.3)] overflow-hidden mb-4"
      />

      {/* Selected Location Display */}
      {tempLocation.name && (
        <div className={`p-3 rounded-lg mb-4 ${
          pointColor === 'green'
            ? 'border border-[rgba(34,197,94,0.3)]'
            : 'border border-[rgba(239,68,68,0.3)]'
        }`}
        style={{
          background: pointColor === 'green' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'
        }}>
          <div className="text-xs mb-1" style={{ color: theme.text.secondary }}>
            Selected Location:
          </div>
          <div className={`text-sm font-semibold ${
            pointColor === 'green' ? 'text-[#22C55E]' : 'text-[#EF4444]'
          }`}>
            ✓ {displayName || tempLocation.name}
          </div>
          <div className="text-[11px] mt-1" style={{ color: theme.text.secondary }}>
            Full address: {tempLocation.name}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: theme.text.secondary }}>
            Coordinates: {tempLocation.latitude?.toFixed(6)}, {tempLocation.longitude?.toFixed(6)}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 border rounded-lg text-xs mb-6" style={{
        background: isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)',
        borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)',
        color: theme.text.primary
      }}>
        💡 <strong>Tip:</strong> Search for a location above or drag the {pointLabel === 'A' ? '🅰️ green' : '🅱️ red'} marker on the map to adjust position precisely.
      </div>

      {/* Confirm Button */}
      <button
        onClick={() => onConfirm({ ...tempLocation, displayName: displayName || tempLocation.name })}
        disabled={!tempLocation.name || !tempLocation.latitude || !displayName}
        className="w-full py-3.5 px-4 border-none rounded-lg text-[15px] font-bold transition-all duration-200"
        style={(!tempLocation.name || !tempLocation.latitude || !displayName)
          ? {
              background: 'rgba(100,100,100,0.2)',
              color: 'rgba(251,251,251,0.3)',
              cursor: 'not-allowed'
            }
          : {
              background: theme.accent.primary,
              color: theme.accent.secondary,
              cursor: 'pointer',
              boxShadow: isDarkMode ? '0 4px 12px rgba(255,212,28,0.4)' : '0 4px 12px rgba(59,130,246,0.4)'
            }
        }
      >
        {pointLabel === 'A' ? 'Set Point A & Continue →' : 'Set Point B & Continue →'}
      </button>
    </div>
  );
}

export default function RoutesList() {
  const { theme, isDarkMode } = useTheme();
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

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBOFPwkdS8TKEe3I2QUDBFWq_q3On5kDBI';
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
    <div className="p-6 h-full flex flex-col">
      {/* Alert */}
      {alert && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000 }}>
          <Alert
            variant={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-[30px] pb-5" style={{ borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]" style={{ color: theme.accent.primary }}>
              <span>🗺️</span> Route Management
            </h2>
            <p className="text-[13px] m-0" style={{ color: theme.text.secondary }}>
              Manage shuttle routes with interactive map
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            style={{
              padding: '12px 24px',
              background: theme.accent.primary,
              color: theme.accent.secondary,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: isDarkMode ? '0 4px 12px rgba(255,212,28,0.4)' : '0 4px 12px rgba(59,130,246,0.4)',
              transition: 'all 0.3s'
            }}
          >
            + Add Route
          </button>
        </div>

        {/* Search and Export Row */}
        <div className="flex gap-3 items-center">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search routes..."
          />
          <ExportButton onClick={handleExport} disabled={filteredRoutes.length === 0} />
        </div>
      </div>

      {/* Table - Scrollable Area */}
      <div className="flex-1 overflow-y-auto pr-2">
      {filteredRoutes.length === 0 ? (
        <div className="text-center py-[60px] text-[rgba(251,251,251,0.5)]">
          <div className="text-5xl mb-4">🗺️</div>
          <div>No routes found</div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[rgba(255,212,28,0.2)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ background: isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)' }}>
                <th style={{ color: theme.accent.primary, borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)' }} className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">Route ID</th>
                <th style={{ color: theme.accent.primary, borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)' }} className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">Route Name</th>
                <th style={{ color: theme.accent.primary, borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)' }} className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">From</th>
                <th style={{ color: theme.accent.primary, borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)' }} className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">To</th>
                <th style={{ color: theme.accent.primary, borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)' }} className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">Fare</th>
                <th style={{ color: theme.accent.primary, borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)' }} className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">Status</th>
                <th style={{ color: theme.accent.primary, borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)' }} className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[rgba(251,251,251,0.5)]">
                    Loading routes...
                  </td>
                </tr>
              ) : currentRoutes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[rgba(251,251,251,0.5)]">
                    No routes found
                  </td>
                </tr>
              ) : (
                currentRoutes.map((route) => (
                  <tr key={route._id} style={{ borderBottom: `1px solid ${theme.border.primary}` }}>
                    <td className="p-4" style={{ color: theme.text.primary }}><strong>{route.routeId}</strong></td>
                    <td className="p-4" style={{ color: theme.text.primary }}>{route.routeName}</td>
                    <td className="p-4" style={{ color: theme.text.primary }}>{route.fromName}</td>
                    <td className="p-4" style={{ color: theme.text.primary }}>{route.toName}</td>
                    <td className="p-4" style={{ color: theme.text.primary }}>₱{route.fare}</td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1.5 rounded-md text-[11px] font-bold uppercase ${
                        route.isActive
                          ? 'bg-[rgba(34,197,94,0.2)] text-[#22C55E]'
                          : 'bg-[rgba(239,68,68,0.2)] text-[#EF4444]'
                      }`}>
                        {route.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleEdit(route)}
                        className="px-3 py-1.5 bg-[rgba(59,130,246,0.2)] text-[#3B82F6] border border-[rgba(59,130,246,0.3)] rounded-md cursor-pointer text-xs font-semibold mr-2 hover:bg-[rgba(59,130,246,0.3)] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(route._id)}
                        className="px-3 py-1.5 bg-[rgba(239,68,68,0.2)] text-[#EF4444] border border-[rgba(239,68,68,0.3)] rounded-md cursor-pointer text-xs font-semibold hover:bg-[rgba(239,68,68,0.3)] transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2.5 mt-5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  background: currentPage === 1 ? (isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)') : (isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'),
                  border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                  borderRadius: '8px',
                  color: currentPage === 1 ? theme.text.muted : theme.accent.primary,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Previous
              </button>
              <span style={{ color: theme.text.secondary, fontSize: '13px', fontWeight: 600 }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  background: currentPage === totalPages ? (isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)') : (isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'),
                  border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                  borderRadius: '8px',
                  color: currentPage === totalPages ? theme.text.muted : theme.accent.primary,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
      </div>

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
            width: '100%',
            height: '100%',
            background: 'rgba(15,18,39,0.9)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1227 100%)',
              borderRadius: '16px',
              border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
              width: '90%',
              maxWidth: '700px',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              animation: 'slideIn 0.3s ease'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: theme.accent.primary, margin: 0 }}>
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                style={{
                  background: 'rgba(239,68,68,0.2)',
                  border: 'none',
                  color: '#EF4444',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >×</button>
            </div>

            {/* Progress Header */}
            <div style={{ padding: '24px', paddingBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                {/* Progress Steps */}
                {!editingRoute && (
                  <div className="flex gap-2 mb-2">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        style={{
                          background: step <= modalStep ? theme.accent.primary : (isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)')
                        }}
                        className="flex-1 h-1 rounded-sm transition-all duration-300"
                      />
                    ))}
                  </div>
                )}

                <div style={{ color: theme.text.secondary }} className="text-[13px]">
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
            </div>

            {/* Step 1: Point A */}
            {modalStep === 1 && !editingRoute && (
              <div style={{ padding: '0 24px 24px 24px' }}>
                {!googleMapsReady ? (
                  <div className="text-center py-8" style={{ color: theme.text.secondary }}>
                    Loading Google Maps...
                  </div>
                ) : (
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
              </div>
            )}

            {/* Step 2: Point B */}
            {modalStep === 2 && !editingRoute && (
              <div style={{ padding: '0 24px 24px 24px' }}>
                {!googleMapsReady ? (
                  <div className="text-center py-8" style={{ color: theme.text.secondary }}>
                    Loading Google Maps...
                  </div>
                ) : (
                  <>
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
                        padding: '12px 16px',
                        background: 'transparent',
                        color: theme.text.primary,
                        border: `2px solid ${theme.border.primary}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        marginTop: '12px',
                        transition: 'all 0.2s'
                      }}
                    >
                      ← Back to Point A
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Route Details */}
            {modalStep === 3 && (
              <div style={{ padding: '0 24px 24px 24px' }}>
                {/* Selected Locations Summary */}
                <div style={{ background: isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)', border: `1px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`, borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', color: theme.text.secondary, marginBottom: '12px' }}>
                    Selected Route:
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-[11px] text-[#22C55E] mb-1">🅰️ FROM</div>
                      <div style={{ fontSize: '14px', color: theme.text.primary, fontWeight: 600 }}>
                        {fromLocation.displayName || fromLocation.name}
                      </div>
                    </div>
                    <div style={{ fontSize: '20px', color: theme.accent.primary }}>→</div>
                    <div className="flex-1">
                      <div className="text-[11px] text-[#EF4444] mb-1">🅱️ TO</div>
                      <div style={{ fontSize: '14px', color: theme.text.primary, fontWeight: 600 }}>
                        {toLocation.displayName || toLocation.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fare and Status */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: theme.accent.primary, textTransform: 'uppercase' }}>
                      Fare (₱) *
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
                        border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                        borderRadius: '8px',
                        background: isDarkMode ? 'rgba(251,251,251,0.05)' : '#FFFFFF',
                        color: theme.text.primary,
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: theme.accent.primary, textTransform: 'uppercase' }}>
                      Status
                    </label>
                    <select
                      value={active ? 'true' : 'false'}
                      onChange={(e) => setActive(e.target.value === 'true')}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                        borderRadius: '8px',
                        background: isDarkMode ? 'rgba(251,251,251,0.05)' : '#FFFFFF',
                        color: theme.text.primary,
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
                      background: isDarkMode ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)',
                      border: `1px solid ${isDarkMode ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'}`,
                      borderRadius: '8px'
                    }}>
                      <input
                        type="checkbox"
                        checked={createReverse}
                        onChange={(e) => setCreateReverse(e.target.checked)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: theme.text.primary, fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                          🔄 Create Reverse Route
                        </div>
                        <div style={{ fontSize: '12px', color: theme.text.secondary }}>
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
                        background: 'transparent',
                        color: theme.text.primary,
                        border: `2px solid ${theme.border.primary}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
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
                      background: theme.accent.primary,
                      color: theme.accent.secondary,
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      boxShadow: isDarkMode ? '0 4px 12px rgba(255,212,28,0.4)' : '0 4px 12px rgba(59,130,246,0.4)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {editingRoute ? 'Update Route' : 'Review →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {modalStep === 4 && !editingRoute && (
              <div style={{ padding: '0 24px 24px 24px' }}>
                <div style={{
                  background: isDarkMode ? 'rgba(255,212,28,0.05)' : 'rgba(59,130,246,0.05)',
                  border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h4 style={{ margin: '0 0 20px 0', color: theme.accent.primary, fontSize: '18px' }}>
                    ✓ Route Summary
                  </h4>

                  {/* Route Details */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: theme.text.secondary, marginBottom: '8px' }}>
                      Main Route:
                    </div>
                    <div style={{
                      background: isDarkMode ? 'rgba(251,251,251,0.05)' : 'rgba(0,0,0,0.03)',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#22C55E', marginBottom: '4px' }}>🅰️ FROM</div>
                          <div style={{ fontSize: '14px', color: theme.text.primary, fontWeight: 600 }}>
                            {fromLocation.displayName || fromLocation.name}
                          </div>
                        </div>
                        <div style={{ fontSize: '20px', color: theme.accent.primary }}>→</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#EF4444', marginBottom: '4px' }}>🅱️ TO</div>
                          <div style={{ fontSize: '14px', color: theme.text.primary, fontWeight: 600 }}>
                            {toLocation.displayName || toLocation.name}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        paddingTop: '12px',
                        borderTop: `1px solid ${theme.border.secondary}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '13px'
                      }}>
                        <div style={{ color: theme.text.secondary }}>
                          Fare: <span style={{ color: theme.accent.primary, fontWeight: 600 }}>₱{fare}</span>
                        </div>
                        <div style={{ color: theme.text.secondary }}>
                          Status: <span style={{ color: active ? '#22C55E' : theme.text.muted, fontWeight: 600 }}>
                            {active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reverse Route Preview */}
                  {createReverse && (
                    <div>
                      <div style={{ fontSize: '12px', color: theme.text.secondary, marginBottom: '8px' }}>
                        Reverse Route (Auto-created):
                      </div>
                      <div style={{
                        background: isDarkMode ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: '#EF4444', marginBottom: '4px' }}>🅱️ FROM</div>
                            <div style={{ fontSize: '14px', color: theme.text.primary, fontWeight: 600 }}>
                              {toLocation.displayName || toLocation.name}
                            </div>
                          </div>
                          <div style={{ fontSize: '20px', color: '#3B82F6' }}>→</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: '#22C55E', marginBottom: '4px' }}>🅰️ TO</div>
                            <div style={{ fontSize: '14px', color: theme.text.primary, fontWeight: 600 }}>
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
                          <div style={{ color: theme.text.secondary }}>
                            Fare: <span style={{ color: '#3B82F6', fontWeight: 600 }}>₱{fare}</span>
                          </div>
                          <div style={{ color: theme.text.secondary }}>
                            Status: <span style={{ color: active ? '#22C55E' : theme.text.muted, fontWeight: 600 }}>
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
                      background: 'transparent',
                      color: theme.text.primary,
                      border: `2px solid ${theme.border.primary}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    ← Back to Edit
                  </button>
                  <button
                    onClick={handleSubmit}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#22C55E',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '15px',
                      boxShadow: '0 4px 12px rgba(34,197,94,0.4)',
                      transition: 'all 0.2s'
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

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
