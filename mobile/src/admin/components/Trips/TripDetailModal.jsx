// src/admin/components/Trips/TripDetailModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import { GOOGLE_MAPS_API_KEY } from '../../config/api.config';
import api from '../../services/api';

export default function TripDetailModal({ trip, onClose, onUpdate }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [localTrip, setLocalTrip] = useState(trip);

  useEffect(() => {
    setLocalTrip(trip);
  }, [trip]);

  useEffect(() => {
    if (!localTrip || !mapRef.current || mapInstanceRef.current) return;

    // Load Google Maps script if not already loaded
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
      } else if (window.googleMapsLoadingPromise) {
        // Wait for the existing promise to resolve
        window.googleMapsLoadingPromise.then(() => {
          if (window.google && window.google.maps) {
            initializeMap();
          }
        }).catch(err => {
          console.error('Failed to load Google Maps:', err);
        });
      } else {
        // Google Maps not loaded and no loading in progress
        console.warn('Google Maps is not available. Please ensure Dashboard loaded first.');
      }
    };

    const initializeMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const bounds = new window.google.maps.LatLngBounds();
      const startPos = { lat: localTrip.startLatitude, lng: localTrip.startLongitude };
      const endPos = { lat: localTrip.endLatitude, lng: localTrip.endLongitude };

      bounds.extend(startPos);
      bounds.extend(endPos);

      // Initialize map
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: bounds.getCenter(),
        zoom: 14,
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

      // Add start marker (green)
      new window.google.maps.Marker({
        position: startPos,
        map: mapInstanceRef.current,
        title: localTrip.startLocationName || 'Start Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#22C55E',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        label: {
          text: '📍',
          fontSize: '16px',
        }
      });

      // Add end marker (red)
      new window.google.maps.Marker({
        position: endPos,
        map: mapInstanceRef.current,
        title: localTrip.endLocationName || 'End Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        label: {
          text: '🏁',
          fontSize: '16px',
        }
      });

      // Draw route line
      new window.google.maps.Polyline({
        path: [startPos, endPos],
        geodesic: true,
        strokeColor: '#FFD41C',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: mapInstanceRef.current,
      });

      // Fit bounds to show both markers
      mapInstanceRef.current.fitBounds(bounds);
    };

    loadGoogleMaps();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [localTrip]);

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;

    setSubmittingNote(true);
    try {
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      const response = await api.post(`/admin/trips/${localTrip._id}/notes`, {
        content: noteContent,
        adminId: adminData._id || 'unknown',
        adminName: adminData.name || 'Admin'
      });

      if (response.trip) {
        setLocalTrip(response.trip);
        setNoteContent('');
        if (onUpdate) onUpdate(response.trip);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (!localTrip) return null;

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return { bg: 'rgba(34,197,94,0.2)', color: '#22C55E' };
      case 'in_progress': return { bg: 'rgba(59,130,246,0.2)', color: '#3B82F6' };
      case 'cancelled': return { bg: 'rgba(239,68,68,0.2)', color: '#EF4444' };
      default: return { bg: 'rgba(107,114,128,0.2)', color: '#6B7280' };
    }
  };

  const statusStyle = getStatusColor(localTrip.status);

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div onClick={onClose} style={{
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
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1227 100%)',
        borderRadius: '16px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '85vh',
        overflow: 'auto',
        border: '2px solid rgba(255,212,28,0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'slideIn 0.3s ease'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '24px',
          borderBottom: '2px solid rgba(255,212,28,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FFD41C', margin: 0 }}>
                Trip Details
              </h2>
              <span style={{ fontSize: '16px', color: '#FFD41C', fontWeight: 700, fontFamily: 'monospace', background: 'rgba(255,212,28,0.15)', padding: '4px 12px', borderRadius: '6px' }}>
                {localTrip.tripId || `#${localTrip._id.slice(-8)}`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: statusStyle.bg,
                color: statusStyle.color
              }}>
                {localTrip.status}
              </span>
              {localTrip.status === 'in_progress' && (
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: 'rgba(251,191,36,0.2)',
                  color: '#FBBF24',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#FBBF24',
                    animation: 'pulse 2s infinite'
                  }} />
                  ACTIVE
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
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
            justifyContent: 'center',
            flexShrink: 0
          }}>×</button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {/* Trip Information */}
          <div style={{
            background: 'rgba(255,212,28,0.05)',
            border: '1px solid rgba(255,212,28,0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase', marginBottom: '12px' }}>
              Trip Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Shuttle ID</div>
                <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontWeight: 600 }}>
                  {localTrip.shuttleId}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Driver</div>
                <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontWeight: 600 }}>
                  {localTrip.driverName || localTrip.driverId}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Route ID</div>
                <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontWeight: 600 }}>
                  {localTrip.routeId}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Distance Traveled</div>
                <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontWeight: 600 }}>
                  {localTrip.distanceTraveledKm ? `${localTrip.distanceTraveledKm} km` : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Timing Information */}
          <div style={{
            background: 'rgba(59,130,246,0.05)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', marginBottom: '12px' }}>
              Timing
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Departure Time</div>
                <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)' }}>
                  {new Date(localTrip.departureTime).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Arrival Time</div>
                <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)' }}>
                  {localTrip.arrivalTime ? new Date(localTrip.arrivalTime).toLocaleString() : 'In Progress'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Duration</div>
                <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontWeight: 600 }}>
                  {formatDuration(localTrip.durationMinutes)}
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div style={{
            background: 'rgba(168,85,247,0.05)',
            border: '1px solid rgba(168,85,247,0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#A855F7', textTransform: 'uppercase', marginBottom: '12px' }}>
              Route Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#A855F7', marginBottom: '8px', fontWeight: 600 }}>📍 Start Location</div>
                <div style={{ fontSize: '13px', color: 'rgba(251,251,251,0.9)', marginBottom: '4px', fontWeight: 600 }}>
                  {localTrip.startLocationName || 'Unknown Location'}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', fontFamily: 'monospace' }}>
                  {localTrip.startLatitude.toFixed(6)}, {localTrip.startLongitude.toFixed(6)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#A855F7', marginBottom: '8px', fontWeight: 600 }}>🏁 End Location</div>
                <div style={{ fontSize: '13px', color: 'rgba(251,251,251,0.9)', marginBottom: '4px', fontWeight: 600 }}>
                  {localTrip.endLocationName || 'Unknown Location'}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', fontFamily: 'monospace' }}>
                  {localTrip.endLatitude.toFixed(6)}, {localTrip.endLongitude.toFixed(6)}
                </div>
              </div>
            </div>

            {/* Route Map Visualization */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', color: '#A855F7', marginBottom: '8px', fontWeight: 600 }}>🗺️ Route Map</div>
              <div
                ref={mapRef}
                style={{
                  width: '100%',
                  height: '300px',
                  borderRadius: '8px',
                  border: '2px solid rgba(168,85,247,0.3)',
                  overflow: 'hidden'
                }}
              />
            </div>
          </div>

          {/* Trip Statistics */}
          <div style={{
            background: 'rgba(34,197,94,0.05)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', marginBottom: '12px' }}>
              Trip Statistics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Total Passengers</div>
                <div style={{ fontSize: '24px', color: '#22C55E', fontWeight: 700 }}>
                  {localTrip.passengerCount || 0}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>Total Collections</div>
                <div style={{ fontSize: '24px', color: '#22C55E', fontWeight: 700 }}>
                  ₱{(localTrip.totalCollections || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Notes/Comments Section */}
          <div style={{
            background: 'rgba(251,191,36,0.05)',
            border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase', marginBottom: '12px' }}>
              📝 Admin Notes
            </h3>

            {/* Existing notes */}
            {localTrip.notes && localTrip.notes.length > 0 ? (
              <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
                {localTrip.notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((note, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px',
                    border: '1px solid rgba(251,191,36,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#FBBF24' }}>
                        {note.adminName || 'Admin'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(251,251,251,0.5)' }}>
                        {new Date(note.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(251,251,251,0.8)', lineHeight: '1.5' }}>
                      {note.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'rgba(251,251,251,0.5)', marginBottom: '16px', textAlign: 'center', padding: '20px' }}>
                No notes yet. Add the first note below.
              </div>
            )}

            {/* Add new note */}
            <div>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add a note about this trip..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#FBFBFB',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '12px'
                }}
              />
              <button
                onClick={handleAddNote}
                disabled={!noteContent.trim() || submittingNote}
                style={{
                  padding: '10px 20px',
                  background: noteContent.trim() && !submittingNote ? '#FBBF24' : 'rgba(251,191,36,0.3)',
                  color: noteContent.trim() && !submittingNote ? '#181D40' : 'rgba(251,251,251,0.5)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: noteContent.trim() && !submittingNote ? 'pointer' : 'not-allowed',
                  width: '100%'
                }}
              >
                {submittingNote ? 'Adding Note...' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '2px solid rgba(255,212,28,0.2)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} style={{
            padding: '12px 24px',
            background: '#FFD41C',
            color: '#181D40',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255,212,28,0.4)'
          }}>
            Close
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
