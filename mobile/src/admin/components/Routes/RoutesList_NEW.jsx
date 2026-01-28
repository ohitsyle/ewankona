// src/admin/components/Routes/RoutesList.jsx
// REDESIGNED: Simple route creation with Google Places search (like Waze)
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import SearchBar from '../common/SearchBar';
import ExportButton from '../common/ExportButton';
import { exportToCSV, prepareDataForExport } from '../../utils/csvExport';

// Google Places Autocomplete Component
function LocationSearch({ value, onChange, placeholder, apiKey }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!window.google || !inputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'ph' }, // Philippines only
      fields: ['formatted_address', 'geometry', 'name']
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        onChange({
          name: place.name || place.formatted_address,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        });
      }
    });
  }, [onChange]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange({ name: e.target.value })}
      placeholder={placeholder}
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
  );
}

export default function RoutesList() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Simplified form data
  const [fromLocation, setFromLocation] = useState({ name: '', latitude: null, longitude: null });
  const [toLocation, setToLocation] = useState({ name: '', latitude: null, longitude: null });
  const [fare, setFare] = useState(15);
  const [active, setActive] = useState(true);

  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyBOFPwkdS8TKEe3I2QUDBFWq_q3On5kDBI';

  // Load Google Maps script
  useEffect(() => {
    if (window.google) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!fromLocation.name || !fromLocation.latitude || !toLocation.name || !toLocation.latitude) {
      setAlert({ type: 'error', message: 'Please select both FROM and TO locations from the suggestions' });
      return;
    }

    try {
      // Auto-generate route name
      const routeName = `${fromLocation.name} → ${toLocation.name}`;

      const payload = {
        routeName,
        fromName: fromLocation.name,
        fromLatitude: fromLocation.latitude,
        fromLongitude: fromLocation.longitude,
        toName: toLocation.name,
        toLatitude: toLocation.latitude,
        toLongitude: toLocation.longitude,
        fare: parseFloat(fare),
        active
      };

      if (editingRoute) {
        await api.put(`/admin/routes/${editingRoute._id}`, payload);
        setAlert({ type: 'success', message: 'Route updated successfully!' });
      } else {
        const newRouteId = getNextRouteId();
        await api.post('/admin/routes', { ...payload, routeId: newRouteId });
        setAlert({ type: 'success', message: 'Route created successfully!' });
      }

      resetForm();
      setShowModal(false);
      loadRoutes();
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to save route' });
    }
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFromLocation({
      name: route.fromName,
      latitude: route.fromLatitude,
      longitude: route.fromLongitude
    });
    setToLocation({
      name: route.toName,
      latitude: route.toLatitude,
      longitude: route.toLongitude
    });
    setFare(route.fare);
    setActive(route.active);
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

  const handleActiveChange = async (route, newActive) => {
    try {
      await api.put(`/admin/routes/${route._id}`, { ...route, active: newActive });
      loadRoutes();
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update route status' });
    }
  };

  const resetForm = () => {
    setFromLocation({ name: '', latitude: null, longitude: null });
    setToLocation({ name: '', latitude: null, longitude: null });
    setFare(15);
    setActive(true);
    setEditingRoute(null);
  };

  const handleExport = () => {
    const dataToExport = prepareDataForExport(filteredRoutes);
    exportToCSV(dataToExport, 'routes');
  };

  // Filter routes
  const filteredRoutes = routes.filter(route => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      route.routeId?.toLowerCase().includes(searchLower) ||
      route.routeName?.toLowerCase().includes(searchLower) ||
      route.fromName?.toLowerCase().includes(searchLower) ||
      route.toName?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#FFD41C' }}>Loading routes...</div>;
  }

  return (
    <div>
      {/* Alert */}
      {alert && (
        <div style={{
          padding: '16px',
          marginBottom: '20px',
          borderRadius: '12px',
          background: alert.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
          border: `2px solid ${alert.type === 'success' ? '#10B981' : '#EF4444'}`,
          color: alert.type === 'success' ? '#10B981' : '#EF4444',
          fontWeight: 600
        }}>
          {alert.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '30px', borderBottom: '2px solid rgba(255,212,28,0.2)', paddingBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#FFD41C', margin: '0 0 8px 0' }}>
          🗺️ Routes
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(251,251,251,0.6)', margin: 0 }}>
          Manage shuttle routes • {routes.length} total
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search routes..." />
        <button onClick={() => { resetForm(); setShowModal(true); }} style={{
          padding: '12px 24px',
          background: '#FFD41C',
          color: '#181D40',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 700,
          cursor: 'pointer',
          fontSize: '14px',
          whiteSpace: 'nowrap'
        }}>
          + Add Route
        </button>
        <ExportButton onClick={handleExport} filename="routes" disabled={routes.length === 0} />
      </div>

      {/* Routes Table */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,212,28,0.2)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,212,28,0.1)', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>
              <th style={{ padding: '16px', textAlign: 'left', color: '#FFD41C', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Route ID</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#FFD41C', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>From → To</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#FFD41C', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Fare</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#FFD41C', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#FFD41C', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutes.map((route) => (
              <tr key={route._id} style={{ borderBottom: '1px solid rgba(255,212,28,0.1)' }}>
                <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)', fontFamily: 'monospace', fontSize: '11px', fontWeight: 700 }}>
                  {route.routeId}
                </td>
                <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)', fontWeight: 600 }}>
                  {route.routeName || `${route.fromName} → ${route.toName}`}
                </td>
                <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                  ₱{route.fare}
                </td>
                <td style={{ padding: '16px' }}>
                  <select
                    value={route.active ? 'active' : 'inactive'}
                    onChange={(e) => handleActiveChange(route, e.target.value === 'active')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: 'none',
                      background: route.active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                      color: route.active ? '#10B981' : '#EF4444',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(route)} style={{
                      padding: '8px 16px',
                      background: 'rgba(59,130,246,0.2)',
                      color: '#3B82F6',
                      border: '1px solid #3B82F6',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(route._id)} style={{
                      padding: '8px 16px',
                      background: 'rgba(239,68,68,0.2)',
                      color: '#EF4444',
                      border: '1px solid #EF4444',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRoutes.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(251,251,251,0.5)' }}>
            {searchQuery ? 'No routes match your search' : 'No routes yet. Click "Add Route" to create one.'}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#181D40',
            borderRadius: '16px',
            border: '2px solid rgba(255,212,28,0.3)',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ color: '#FFD41C', marginTop: 0, marginBottom: '24px', fontSize: '20px', fontWeight: 700 }}>
              {editingRoute ? 'Edit Route' : 'Add New Route'}
            </h3>

            <form onSubmit={handleSubmit}>
              {/* FROM Location */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>
                  From Location *
                </label>
                <LocationSearch
                  value={fromLocation.name}
                  onChange={setFromLocation}
                  placeholder="Search for starting location..."
                  apiKey={GOOGLE_MAPS_API_KEY}
                />
                {fromLocation.latitude && (
                  <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginTop: '4px' }}>
                    📍 {fromLocation.latitude.toFixed(6)}, {fromLocation.longitude.toFixed(6)}
                  </div>
                )}
              </div>

              {/* TO Location */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>
                  To Location *
                </label>
                <LocationSearch
                  value={toLocation.name}
                  onChange={setToLocation}
                  placeholder="Search for destination..."
                  apiKey={GOOGLE_MAPS_API_KEY}
                />
                {toLocation.latitude && (
                  <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginTop: '4px' }}>
                    📍 {toLocation.latitude.toFixed(6)}, {toLocation.longitude.toFixed(6)}
                  </div>
                )}
              </div>

              {/* Auto-generated Route Name Preview */}
              {fromLocation.name && toLocation.name && (
                <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,212,28,0.1)', borderRadius: '8px', border: '1px solid rgba(255,212,28,0.2)' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.6)', marginBottom: '4px' }}>ROUTE NAME (AUTO-GENERATED)</div>
                  <div style={{ fontSize: '14px', color: '#FFD41C', fontWeight: 600 }}>
                    {fromLocation.name} → {toLocation.name}
                  </div>
                </div>
              )}

              {/* Fare */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>
                  Fare (₱) *
                </label>
                <input
                  type="number"
                  value={fare}
                  onChange={(e) => setFare(e.target.value)}
                  required
                  min="0"
                  step="1"
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

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '12px 24px',
                  background: 'rgba(251,251,251,0.1)',
                  color: 'rgba(251,251,251,0.7)',
                  border: '1px solid rgba(251,251,251,0.2)',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  Cancel
                </button>
                <button type="submit" style={{
                  padding: '12px 24px',
                  background: '#FFD41C',
                  color: '#181D40',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}>
                  {editingRoute ? 'Update Route' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
