// src/admin/components/Dashboard/Dashboard.jsx
// Simplified dashboard with live shuttle tracking
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { GOOGLE_MAPS_API_KEY } from '../../../config/api.config';

export default function Dashboard() {
  const { theme, isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    today: { rides: 0, revenue: 0, passengers: 0 },
    activeShuttles: 0
  });
  const [shuttlePositions, setShuttlePositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const scriptLoadedRef = useRef(false);

  // Load dashboard stats
  const loadStats = async () => {
    try {
      const data = await api.get('/admin/analytics/dashboard');
      setStats({
        today: data?.today || { rides: 0, revenue: 0, passengers: 0 },
        activeShuttles: data?.activeShuttles || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load shuttle positions for map
  const loadShuttlePositions = async () => {
    try {
      const data = await api.get('/admin/shuttle-positions');
      setShuttlePositions(Array.isArray(data) ? data : []);
      updateMapMarkers(data || []);
    } catch (error) {
      console.error('Error loading shuttle positions:', error);
    }
  };

  // Callback ref to initialize map when element is ready
  const mapCallbackRef = useCallback((node) => {
    if (node && window.google && window.google.maps && !mapInstanceRef.current) {
      try {
        const nuLagunaCenter = { lat: 14.17815, lng: 121.1359 };

        console.log('🗺️ Initializing map...');

        // Dark or Light map styles based on theme
        const mapStyles = isDarkMode ? [
          { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
        ] : [
          { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e0e0e0' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d9f1' }] },
          { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
        ];

        mapInstanceRef.current = new window.google.maps.Map(node, {
          center: nuLagunaCenter,
          zoom: 15,
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
        });

        console.log('✅ Map initialized successfully');
        setMapError(null);
        loadShuttlePositions();
      } catch (err) {
        console.error('❌ Map initialization error:', err);
        setMapError(`Failed to initialize map: ${err.message}`);
      }
    }
    mapRef.current = node;
  }, [isDarkMode]);

  // Update map markers
  const updateMapMarkers = (positions) => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    positions.forEach(pos => {
      if (pos.latitude && pos.longitude) {
        // Shuttle marker (current position)
        const marker = new window.google.maps.Marker({
          position: { lat: pos.latitude, lng: pos.longitude },
          map: mapInstanceRef.current,
          title: pos.shuttleId,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: isDarkMode ? '#FFD41C' : '#3B82F6',
            fillOpacity: 1,
            strokeColor: isDarkMode ? '#181D40' : '#FFFFFF',
            strokeWeight: 3,
          },
          label: {
            text: '🚐',
            fontSize: '16px',
          }
        });

        // Destination marker (if route exists)
        let destinationMarker = null;
        if (pos.currentTrip?.endLatitude && pos.currentTrip?.endLongitude) {
          destinationMarker = new window.google.maps.Marker({
            position: {
              lat: pos.currentTrip.endLatitude,
              lng: pos.currentTrip.endLongitude
            },
            map: mapInstanceRef.current,
            title: 'Destination',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#EF4444',
              fillOpacity: 1,
              strokeColor: '#FBFBFB',
              strokeWeight: 3,
            },
            label: {
              text: '🎯',
              fontSize: '14px',
            }
          });
          markersRef.current.push(destinationMarker);
        }

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="color: #181D40; padding: 12px; min-width: 250px;">
              <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: #FFD41C; background: #181D40; padding: 6px; border-radius: 4px;">
                ${pos.shuttleId}
              </div>
              <div style="margin-bottom: 4px;">
                <strong>Driver:</strong> ${pos.driverName || 'No driver assigned'}
              </div>
              ${pos.vehicleInfo ? `<div style="margin-bottom: 4px;"><strong>Vehicle:</strong> ${pos.vehicleInfo}</div>` : ''}
              ${pos.route ? `
                <div style="margin-top: 12px; padding: 8px; background: #f0f0f0; border-radius: 4px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">Route: ${pos.route.routeName}</div>
                  <div style="font-size: 12px; color: #666;">📍 From: ${pos.route.fromName}</div>
                  <div style="font-size: 12px; color: #666;">🎯 To: ${pos.route.toName}</div>
                </div>
              ` : ''}
              <div style="margin-top: 8px; font-size: 11px; color: #666;">
                Current location: ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}
              </div>
              <div style="font-size: 11px; color: #666;">
                Last update: ${new Date(pos.updatedAt).toLocaleTimeString()}
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
          // Center map on clicked shuttle
          mapInstanceRef.current.panTo({ lat: pos.latitude, lng: pos.longitude });
          mapInstanceRef.current.setZoom(16);
        });

        markersRef.current.push(marker);
      }
    });
  };

  useEffect(() => {
    loadStats();

    // Load Google Maps script only once globally
    if (!window.googleMapsLoadingPromise && !window.google?.maps) {
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('❌ Google Maps API key is missing');
        setMapError('Google Maps API key not configured');
        return;
      }

      // Check if script already exists in DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (!existingScript) {
        // Create a global promise for the script loading
        // Include 'places' library for RoutesList component
        window.googleMapsLoadingPromise = new Promise((resolve, reject) => {
          window.initGoogleMaps = () => {
            console.log('✅ Google Maps loaded successfully (with places library)');
            resolve();
          };

          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
          script.async = true;
          script.defer = true;
          script.onerror = (error) => {
            console.error('❌ Failed to load Google Maps:', error);
            setMapError('Failed to load Google Maps. Please check API key.');
            reject(error);
          };
          document.head.appendChild(script);
        });
      } else {
        console.log('✅ Google Maps script already in DOM');
      }
    }

    // Auto-refresh every 2 seconds
    const interval = setInterval(() => {
      loadStats();
      loadShuttlePositions();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ color: theme.accent.primary }} className="text-center py-[60px]">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-[30px] border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>🏠</span> Home
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Real-time motorpool analytics • Auto-updates every 5 seconds
        </p>
      </div>

      {/* Stats Grid - Only 4 cards */}
      <div className="grid grid-cols-4 gap-5 mb-[30px]">
        <StatCard
          icon="🚐"
          label="TODAY'S RIDES"
          value={stats.today?.rides || 0}
          subtitle="trips completed"
          color="#10B981"
          theme={theme}
        />
        <StatCard
          icon="💰"
          label="TODAY'S COLLECTIONS"
          value={`₱${(stats.today?.revenue || 0).toLocaleString()}`}
          subtitle="fare collected"
          color="#FFD41C"
          theme={theme}
        />
        <StatCard
          icon="👥"
          label="TODAY'S PASSENGERS"
          value={stats.today?.passengers || 0}
          subtitle="total today"
          color="#3B82F6"
          theme={theme}
        />
        <StatCard
          icon="🚐"
          label="ACTIVE SHUTTLES"
          value={`${shuttlePositions.length}/${stats.activeShuttles || 0}`}
          subtitle="in transit / total"
          color="#A855F7"
          theme={theme}
        />
      </div>

      {/* Live Shuttle Map - Scrollable Area */}
      <div className="flex-1 overflow-y-auto pr-2">
      <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border overflow-hidden">
        <div style={{ borderColor: theme.border.primary }} className="p-5 border-b flex justify-between items-center">
          <div>
            <h3 style={{ color: theme.accent.primary }} className="m-0 mb-1 text-lg font-bold">
              🗺️ Live Shuttle Tracking
            </h3>
            <p style={{ color: theme.text.secondary }} className="m-0 text-xs">
              {shuttlePositions.length} shuttle(s) currently in transit
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[rgba(16,185,129,0.2)] px-3 py-1.5 rounded-[20px] border border-[rgba(16,185,129,0.3)]">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#10B981] text-xs font-semibold">LIVE</span>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative h-[500px]">
          {mapError ? (
            <div style={{ color: theme.text.tertiary }} className="h-full flex flex-col items-center justify-center p-10">
              <div className="text-5xl mb-4">🗺️</div>
              <div className="mb-2 text-[#EF4444]">{mapError}</div>
              <div className="text-xs opacity-70">
                Check console for details
              </div>
            </div>
          ) : (
            <div ref={mapCallbackRef} className="w-full h-full" />
          )}
        </div>

        {/* Shuttle Cards - Below the map */}
        {shuttlePositions.length > 0 && !mapError && (
          <div style={{ borderColor: theme.border.primary }} className="p-5 border-t">
            <div style={{ color: theme.accent.primary }} className="text-[11px] font-bold mb-3 uppercase tracking-wide">
              Shuttles in Transit ({shuttlePositions.length})
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
              {shuttlePositions.map((pos, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (mapInstanceRef.current && pos.latitude && pos.longitude) {
                      mapInstanceRef.current.panTo({ lat: pos.latitude, lng: pos.longitude });
                      mapInstanceRef.current.setZoom(16);
                    }
                  }}
                  style={{
                    background: theme.bg.card,
                    borderColor: theme.border.primary
                  }}
                  className="border rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 text-left hover:-translate-y-0.5"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)';
                    e.currentTarget.style.borderColor = theme.border.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.bg.card;
                    e.currentTarget.style.borderColor = theme.border.primary;
                  }}
                >
                  <div className="flex items-center gap-[10px] mb-2">
                    <span className="text-xl">🚐</span>
                    <span style={{ color: theme.accent.primary }} className="text-sm font-bold">{pos.shuttleId}</span>
                    <span style={{ color: theme.text.tertiary }} className="text-[10px]">•</span>
                    <span style={{ color: theme.text.secondary }} className="text-xs">{pos.driverName || 'Unknown'}</span>
                  </div>
                  {pos.route && (
                    <div style={{
                      color: theme.text.primary,
                      borderColor: theme.accent.primary,
                      background: isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)'
                    }} className="text-xs mb-1.5 px-2 py-1.5 rounded-md border-l-[3px]">
                      <div className="font-semibold mb-0.5">📍 {pos.route.fromName} → 🎯 {pos.route.toName}</div>
                    </div>
                  )}
                  <div style={{ color: theme.text.tertiary }} className="text-[11px]">
                    Current: {pos.latitude?.toFixed(5)}, {pos.longitude?.toFixed(5)}
                  </div>
                  {pos.updatedAt && (
                    <div style={{ color: theme.text.muted }} className="text-[10px] mt-1">
                      Updated {new Date(pos.updatedAt).toLocaleTimeString()}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>

    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, subtitle, color, theme }) {
  return (
    <div style={{
      background: theme.bg.card,
      borderColor: theme.border.primary
    }} className="p-6 rounded-2xl border relative overflow-hidden transition-all duration-300">
      <div className="absolute right-4 top-4 text-[40px] opacity-15">
        {icon}
      </div>
      <div style={{ color: theme.text.secondary }} className="text-[11px] font-bold uppercase tracking-wide mb-3">
        {label}
      </div>
      <div style={{ color: theme.text.primary }} className="text-[32px] font-extrabold mb-2">
        {value}
      </div>
      <div className="text-xs font-semibold inline-block py-[3px] px-[10px] rounded-xl" style={{
        color: color,
        background: `${color}20`
      }}>
        {subtitle}
      </div>
    </div>
  );
}
