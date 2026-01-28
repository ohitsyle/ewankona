// src/admin/components/Dashboard/Dashboard.jsx
// Simplified dashboard with live shuttle tracking
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import { GOOGLE_MAPS_API_KEY } from '../../config/api.config';

export default function Dashboard() {
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

        mapInstanceRef.current = new window.google.maps.Map(node, {
          center: nuLagunaCenter,
          zoom: 15,
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
            { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
            { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
          ],
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
  }, []);

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
            fillColor: '#FFD41C',
            fillOpacity: 1,
            strokeColor: '#181D40',
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
      <div style={{ textAlign: 'center', padding: '60px', color: '#FFD41C' }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px', borderBottom: '2px solid rgba(255,212,28,0.2)', paddingBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#FFD41C', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🏠</span> Home
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(251,251,251,0.6)', margin: 0 }}>
          Real-time motorpool analytics • Auto-updates every 5 seconds
        </p>
      </div>

      {/* Stats Grid - Only 4 cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <StatCard
          icon="🚐"
          label="TODAY'S RIDES"
          value={stats.today?.rides || 0}
          subtitle="trips completed"
          color="#10B981"
        />
        <StatCard
          icon="💰"
          label="TODAY'S COLLECTIONS"
          value={`₱${(stats.today?.revenue || 0).toLocaleString()}`}
          subtitle="fare collected"
          color="#FFD41C"
        />
        <StatCard
          icon="👥"
          label="TODAY'S PASSENGERS"
          value={stats.today?.passengers || 0}
          subtitle="total today"
          color="#3B82F6"
        />
        <StatCard
          icon="🚐"
          label="ACTIVE SHUTTLES"
          value={`${shuttlePositions.length}/${stats.activeShuttles || 0}`}
          subtitle="in transit / total"
          color="#A855F7"
        />
      </div>

      {/* Live Shuttle Map - Scrollable Area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255,212,28,0.2)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,212,28,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ color: '#FFD41C', margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>
              🗺️ Live Shuttle Tracking
            </h3>
            <p style={{ color: 'rgba(251,251,251,0.6)', margin: 0, fontSize: '12px' }}>
              {shuttlePositions.length} shuttle(s) currently in transit
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16,185,129,0.2)',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid rgba(16,185,129,0.3)'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{ color: '#10B981', fontSize: '12px', fontWeight: 600 }}>LIVE</span>
          </div>
        </div>

        {/* Map Container */}
        <div style={{ position: 'relative', height: '500px' }}>
          {mapError ? (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(251,251,251,0.5)',
              padding: '40px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
              <div style={{ marginBottom: '8px', color: '#EF4444' }}>{mapError}</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>
                Check console for details
              </div>
            </div>
          ) : (
            <div ref={mapCallbackRef} style={{ width: '100%', height: '100%' }} />
          )}
        </div>

        {/* Shuttle Cards - Below the map */}
        {shuttlePositions.length > 0 && !mapError && (
          <div style={{
            padding: '20px',
            borderTop: '1px solid rgba(255,212,28,0.2)'
          }}>
            <div style={{ fontSize: '11px', color: '#FFD41C', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Shuttles in Transit ({shuttlePositions.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
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
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,212,28,0.2)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,212,28,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255,212,28,0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,212,28,0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🚐</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFD41C' }}>{pos.shuttleId}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(251,251,251,0.5)' }}>•</span>
                    <span style={{ fontSize: '12px', color: 'rgba(251,251,251,0.7)' }}>{pos.driverName || 'Unknown'}</span>
                  </div>
                  {pos.route && (
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(251,251,251,0.9)',
                      marginBottom: '6px',
                      padding: '6px 8px',
                      background: 'rgba(255,212,28,0.1)',
                      borderRadius: '6px',
                      borderLeft: '3px solid #FFD41C'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '2px' }}>📍 {pos.route.fromName} → 🎯 {pos.route.toName}</div>
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)' }}>
                    Current: {pos.latitude?.toFixed(5)}, {pos.longitude?.toFixed(5)}
                  </div>
                  {pos.updatedAt && (
                    <div style={{ fontSize: '10px', color: 'rgba(251,251,251,0.4)', marginTop: '4px' }}>
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

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, subtitle, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      padding: '24px',
      borderRadius: '16px',
      border: '1px solid rgba(255,212,28,0.2)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        position: 'absolute',
        right: '16px',
        top: '16px',
        fontSize: '40px',
        opacity: 0.15
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: '11px',
        color: 'rgba(251,251,251,0.6)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '12px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '32px',
        fontWeight: 800,
        color: '#FBFBFB',
        marginBottom: '8px'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '12px',
        color: color,
        fontWeight: 600,
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '12px',
        background: `${color}20`
      }}>
        {subtitle}
      </div>
    </div>
  );
}
