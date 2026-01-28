// src/admin/components/Routes/RoutesList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import SearchBar from '../common/SearchBar';
import ExportButton from '../common/ExportButton';
import { exportToCSV, prepareDataForExport } from '../../utils/csvExport';

export default function RoutesList() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    routeId: '',
    routeName: '',
    shortName: '',
    description: '',
    destinationName: '',
    destinationLatitude: '',
    destinationLongitude: '',
    fare: 15,
    active: true
  });

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
    try {
      const payload = {
        ...formData,
        destinationLatitude: parseFloat(formData.destinationLatitude),
        destinationLongitude: parseFloat(formData.destinationLongitude),
        fare: parseFloat(formData.fare)
      };

      if (editingRoute) {
        await api.put(`/admin/routes/${editingRoute._id}`, payload);
        setAlert({ type: 'success', message: 'Route updated successfully!' });
      } else {
        const newRouteId = getNextRouteId();
        await api.post('/admin/routes', { ...payload, routeId: newRouteId });
        setAlert({ type: 'success', message: 'Route created successfully!' });
      }
      setShowModal(false);
      setEditingRoute(null);
      resetForm();
      loadRoutes();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Failed to save route' });
    }
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      routeId: route.routeId,
      routeName: route.routeName,
      shortName: route.shortName || '',
      description: route.description || '',
      destinationName: route.destinationName,
      destinationLatitude: route.destinationLatitude,
      destinationLongitude: route.destinationLongitude,
      fare: route.fare,
      active: route.active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      await api.delete(`/admin/routes/${id}`);
      setAlert({ type: 'success', message: 'Route deleted successfully!' });
      loadRoutes();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Failed to delete route' });
    }
  };

  const handleActiveChange = async (route, newActiveStatus) => {
    try {
      await api.put(`/admin/routes/${route._id}`, { ...route, active: newActiveStatus });
      setAlert({ type: 'success', message: `Route ${newActiveStatus ? 'activated' : 'deactivated'}!` });
      loadRoutes();
      setTimeout(() => setAlert(null), 2000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update route' });
    }
  };

  const resetForm = () => {
    setFormData({
      routeId: '',
      routeName: '',
      shortName: '',
      description: '',
      destinationName: '',
      destinationLatitude: '',
      destinationLongitude: '',
      fare: 15,
      active: true
    });
  };

  const handleExport = () => {
    const dataToExport = prepareDataForExport(filteredRoutes);
    exportToCSV(dataToExport, 'routes');
  };

  const filteredRoutes = routes.filter(route => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      route.routeId?.toLowerCase().includes(searchLower) ||
      route.routeName?.toLowerCase().includes(searchLower) ||
      route.shortName?.toLowerCase().includes(searchLower) ||
      route.destinationName?.toLowerCase().includes(searchLower) ||
      route.description?.toLowerCase().includes(searchLower)
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
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '16px 24px',
          borderRadius: '8px',
          background: alert.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
          color: alert.type === 'success' ? '#22C55E' : '#EF4444',
          border: `2px solid ${alert.type === 'success' ? '#22C55E' : '#EF4444'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 10000,
          animation: 'fadeIn 0.3s ease'
        }}>
          {alert.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '30px', borderBottom: '2px solid rgba(255,212,28,0.2)', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#FFD41C', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🗺️</span> Route Management
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(251,251,251,0.6)', margin: 0 }}>
              {searchQuery ? `Showing: ${filteredRoutes.length} of ${routes.length}` : `Total routes: ${routes.length} • Active: ${routes.filter(r => r.active).length}`}
            </p>
          </div>
          <button onClick={() => { resetForm(); setEditingRoute(null); setShowModal(true); }} style={{
            padding: '12px 24px',
            background: '#FFD41C',
            color: '#181D40',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255,212,28,0.4)',
            transition: 'all 0.3s'
          }}>
            + Add Route
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by route name, ID, or destination..."
          />
          <ExportButton onClick={handleExport} disabled={filteredRoutes.length === 0} />
        </div>
      </div>

      {/* Table */}
      {routes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(251,251,251,0.5)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
          <div>No routes found</div>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(251,251,251,0.5)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <div style={{ marginBottom: '12px' }}>No routes match your search</div>
          <button onClick={() => setSearchQuery('')} style={{
            padding: '8px 16px',
            background: 'rgba(255,212,28,0.15)',
            border: '2px solid rgba(255,212,28,0.3)',
            borderRadius: '8px',
            color: '#FFD41C',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Clear Search
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,212,28,0.2)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,212,28,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Route ID</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Route Name</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Destination</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Coordinates</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Fare</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.map((route) => (
                <tr key={route._id} style={{ borderBottom: '1px solid rgba(255,212,28,0.1)' }}>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    <strong>{route.routeId}</strong>
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    <div>{route.routeName}</div>
                    {route.shortName && <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginTop: '4px' }}>{route.shortName}</div>}
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    {route.destinationName}
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.7)', fontSize: '11px', fontFamily: 'monospace' }}>
                    {route.destinationLatitude.toFixed(6)}, {route.destinationLongitude.toFixed(6)}
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    ₱{route.fare}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <select value={route.active ? 'active' : 'inactive'} onChange={(e) => handleActiveChange(route, e.target.value === 'active')} style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      border: 'none',
                      cursor: 'pointer',
                      background: route.active ? 'rgba(34,197,94,0.2)' : 'rgba(107,114,128,0.2)',
                      color: route.active ? '#22C55E' : '#6B7280'
                    }}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button onClick={() => handleEdit(route)} style={{
                      padding: '6px 12px',
                      background: 'rgba(59,130,246,0.2)',
                      color: '#3B82F6',
                      border: '1px solid rgba(59,130,246,0.3)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginRight: '8px'
                    }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(route._id)} style={{
                      padding: '6px 12px',
                      background: 'rgba(239,68,68,0.2)',
                      color: '#EF4444',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ANIMATED MODAL */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{
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
            maxWidth: '600px',
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
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FFD41C', margin: 0 }}>
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{
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
              }}>×</button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>
                  Route ID {!editingRoute && <span style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', fontWeight: 400 }}>(Auto-generated)</span>}
                </label>
                <input 
                  type="text" 
                  value={editingRoute ? formData.routeId : getNextRouteId()} 
                  disabled 
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid rgba(255,212,28,0.2)',
                    borderRadius: '8px',
                    background: 'rgba(100,100,100,0.2)',
                    color: 'rgba(251,251,251,0.5)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    cursor: 'not-allowed'
                  }} 
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Route Name *</label>
                <input type="text" value={formData.routeName} onChange={(e) => setFormData({...formData, routeName: e.target.value})} required style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(255,212,28,0.3)',
                  borderRadius: '8px',
                  background: 'rgba(251,251,251,0.05)',
                  color: 'rgba(251,251,251,0.9)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} placeholder="e.g., NU → SM Calamba" />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Short Name</label>
                <input type="text" value={formData.shortName} onChange={(e) => setFormData({...formData, shortName: e.target.value})} style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(255,212,28,0.3)',
                  borderRadius: '8px',
                  background: 'rgba(251,251,251,0.05)',
                  color: 'rgba(251,251,251,0.9)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} placeholder="e.g., NU-SM" />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="2" style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(255,212,28,0.3)',
                  borderRadius: '8px',
                  background: 'rgba(251,251,251,0.05)',
                  color: 'rgba(251,251,251,0.9)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }} placeholder="Optional description" />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Destination Name *</label>
                <input type="text" value={formData.destinationName} onChange={(e) => setFormData({...formData, destinationName: e.target.value})} required style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(255,212,28,0.3)',
                  borderRadius: '8px',
                  background: 'rgba(251,251,251,0.05)',
                  color: 'rgba(251,251,251,0.9)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} placeholder="e.g., SM City Calamba" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Latitude *</label>
                  <input type="number" step="0.000001" value={formData.destinationLatitude} onChange={(e) => setFormData({...formData, destinationLatitude: e.target.value})} required style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid rgba(255,212,28,0.3)',
                    borderRadius: '8px',
                    background: 'rgba(251,251,251,0.05)',
                    color: 'rgba(251,251,251,0.9)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }} placeholder="14.123456" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Longitude *</label>
                  <input type="number" step="0.000001" value={formData.destinationLongitude} onChange={(e) => setFormData({...formData, destinationLongitude: e.target.value})} required style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid rgba(255,212,28,0.3)',
                    borderRadius: '8px',
                    background: 'rgba(251,251,251,0.05)',
                    color: 'rgba(251,251,251,0.9)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }} placeholder="121.123456" />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Fare (₱) *</label>
                <input type="number" step="0.01" value={formData.fare} onChange={(e) => setFormData({...formData, fare: e.target.value})} required min="0" style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(255,212,28,0.3)',
                  borderRadius: '8px',
                  background: 'rgba(251,251,251,0.05)',
                  color: 'rgba(251,251,251,0.9)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({...formData, active: e.target.checked})} style={{
                    marginRight: '8px',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(251,251,251,0.9)' }}>Active Route</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '2px solid rgba(255,212,28,0.2)' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  padding: '12px 24px',
                  background: 'rgba(251,251,251,0.1)',
                  color: 'rgba(251,251,251,0.7)',
                  border: '1px solid rgba(251,251,251,0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
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
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255,212,28,0.4)'
                }}>
                  {editingRoute ? 'Update Route' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
      `}</style>
    </div>
  );
}