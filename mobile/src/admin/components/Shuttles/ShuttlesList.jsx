// src/admin/components/shuttles/ShuttlesList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import SearchBar from '../common/SearchBar';
import ExportButton from '../common/ExportButton';
import StatusFilter from '../common/StatusFilter';
import { exportToCSV, prepareDataForExport } from '../../utils/csvExport';

export default function ShuttlesList() {
  const [shuttles, setShuttles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShuttle, setEditingShuttle] = useState(null);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [formData, setFormData] = useState({
    shuttleId: '',
    vehicleType: '',
    vehicleModel: '',
    plateNumber: '',
    capacity: 15
  });

  const loadShuttles = async () => {
    try {
      const data = await api.get('/admin/shuttles');
      setShuttles(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading shuttles:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShuttles();
    const interval = setInterval(loadShuttles, 2000);
    return () => clearInterval(interval);
  }, []);

  const getNextShuttleId = () => {
  if (shuttles.length === 0) return 'SHUTTLE_001';
  
  let highestNum = 0;
  for (const shuttle of shuttles) {
    if (shuttle.shuttleId) {
      const match = shuttle.shuttleId.match(/SHUTTLE_(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNum) highestNum = num;
      }
    }
  }
  
  return `SHUTTLE_${String(highestNum + 1).padStart(3, '0')}`;
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingShuttle) {
        await api.put(`/admin/shuttles/${editingShuttle._id}`, formData);
        setAlert({ type: 'success', message: 'Shuttle updated successfully!' });
      } else {
        const newShuttleId = getNextShuttleId();
        await api.post('/admin/shuttles', { ...formData, shuttleId: newShuttleId });
        setAlert({ type: 'success', message: 'Shuttle created successfully!' });
      }
      setShowModal(false);
      setEditingShuttle(null);
      resetForm();
      loadShuttles();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Failed to save shuttle' });
    }
  };

  const handleEdit = (shuttle) => {
    setEditingShuttle(shuttle);
    setFormData({
      shuttleId: shuttle.shuttleId,
      vehicleType: shuttle.vehicleType,
      vehicleModel: shuttle.vehicleModel,
      plateNumber: shuttle.plateNumber || '',
      capacity: shuttle.capacity || 15
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shuttle?')) return;
    try {
      await api.delete(`/admin/shuttles/${id}`);
      setAlert({ type: 'success', message: 'Shuttle deleted successfully!' });
      loadShuttles();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Failed to delete shuttle' });
    }
  };

  const handleStatusChange = async (shuttle, newStatus) => {
    try {
      await api.put(`/admin/shuttles/${shuttle._id}`, { ...shuttle, status: newStatus });
      setAlert({ type: 'success', message: 'Status updated!' });
      loadShuttles();
      setTimeout(() => setAlert(null), 2000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update status' });
    }
  };

  const resetForm = () => {
    setFormData({ shuttleId: '', vehicleType: '', vehicleModel: '', plateNumber: '', capacity: 15 });
  };

  const handleExport = () => {
    const dataToExport = prepareDataForExport(filteredShuttles);
    exportToCSV(dataToExport, 'shuttles');
  };

  const filteredShuttles = shuttles.filter(shuttle => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        shuttle.shuttleId?.toLowerCase().includes(searchLower) ||
        shuttle.vehicleType?.toLowerCase().includes(searchLower) ||
        shuttle.vehicleModel?.toLowerCase().includes(searchLower) ||
        shuttle.plateNumber?.toLowerCase().includes(searchLower) ||
        shuttle.status?.toLowerCase().includes(searchLower) ||
        shuttle.currentDriver?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter && shuttle.status !== statusFilter) return false;

    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredShuttles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredShuttles.slice(startIndex, endIndex);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#FFD41C' }}>Loading shuttles...</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
              <span>🚐</span> Fleet Management
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(251,251,251,0.6)', margin: 0 }}>
              {filteredShuttles.length > 0
                ? `Showing ${startIndex + 1}-${Math.min(endIndex, filteredShuttles.length)} of ${filteredShuttles.length} • Page ${currentPage} of ${totalPages}`
                : `Total shuttles: ${shuttles.length}`
              }
            </p>
          </div>
          <button onClick={() => { resetForm(); setEditingShuttle(null); setShowModal(true); }} style={{
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
            + Add Shuttle
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by ID, vehicle, plate, status, or driver..."
          />
          <StatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
            label="Status"
            options={[
              { value: 'available', label: 'Available' },
              { value: 'reserved', label: 'Reserved' },
              { value: 'taken', label: 'Taken' },
              { value: 'unavailable', label: 'Unavailable' }
            ]}
          />
          <ExportButton onClick={handleExport} disabled={filteredShuttles.length === 0} />
        </div>
      </div>

      {/* Table - Scrollable Area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
      {shuttles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(251,251,251,0.5)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚐</div>
          <div>No shuttles found</div>
        </div>
      ) : filteredShuttles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(251,251,251,0.5)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <div style={{ marginBottom: '12px' }}>No shuttles match your search</div>
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
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Shuttle ID</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Vehicle</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Plate</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Capacity</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Current Driver</th>
                <th style={{ textAlign: 'right', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((shuttle) => (
                <tr key={shuttle._id} style={{ borderBottom: '1px solid rgba(255,212,28,0.1)' }}>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    <strong>{shuttle.shuttleId}</strong>
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    {shuttle.vehicleType} {shuttle.vehicleModel}
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    {shuttle.plateNumber || 'N/A'}
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    {shuttle.capacity} pax
                  </td>
                  <td style={{ padding: '16px' }}>
                    <select value={shuttle.status} onChange={(e) => handleStatusChange(shuttle, e.target.value)} style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      border: 'none',
                      cursor: 'pointer',
                      background: shuttle.status === 'available' ? 'rgba(34,197,94,0.2)' : shuttle.status === 'reserved' ? 'rgba(59,130,246,0.2)' : shuttle.status === 'taken' ? 'rgba(251,191,36,0.2)' : 'rgba(239,68,68,0.2)',
                      color: shuttle.status === 'available' ? '#22C55E' : shuttle.status === 'reserved' ? '#3B82F6' : shuttle.status === 'taken' ? '#FBBF24' : '#EF4444'
                    }}>
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="taken">Taken</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.7)', fontSize: '12px' }}>
                    {shuttle.currentDriver || '—'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button onClick={() => handleEdit(shuttle)} style={{
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
                    <button onClick={() => handleDelete(shuttle._id)} style={{
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  background: currentPage === 1 ? 'rgba(255,212,28,0.1)' : 'rgba(255,212,28,0.2)',
                  border: '2px solid rgba(255,212,28,0.3)',
                  borderRadius: '8px',
                  color: currentPage === 1 ? 'rgba(251,251,251,0.3)' : '#FFD41C',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Previous
              </button>
              <span style={{ color: 'rgba(251,251,251,0.7)', fontSize: '13px', fontWeight: 600 }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  background: currentPage === totalPages ? 'rgba(255,212,28,0.1)' : 'rgba(255,212,28,0.2)',
                  border: '2px solid rgba(255,212,28,0.3)',
                  borderRadius: '8px',
                  color: currentPage === totalPages ? 'rgba(251,251,251,0.3)' : '#FFD41C',
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
                {editingShuttle ? 'Edit Shuttle' : 'Add New Shuttle'}
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
                  Shuttle ID {!editingShuttle && <span style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', fontWeight: 400 }}>(Auto-generated)</span>}
                </label>
                <input 
                  type="text" 
                  value={editingShuttle ? formData.shuttleId : getNextShuttleId()} 
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
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Vehicle Type *</label>
                <input type="text" value={formData.vehicleType} onChange={(e) => setFormData({...formData, vehicleType: e.target.value})} required style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(255,212,28,0.3)',
                  borderRadius: '8px',
                  background: 'rgba(251,251,251,0.05)',
                  color: 'rgba(251,251,251,0.9)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} placeholder="e.g., Isuzu, Toyota" />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Vehicle Model *</label>
                <input type="text" value={formData.vehicleModel} onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})} required style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(255,212,28,0.3)',
                  borderRadius: '8px',
                  background: 'rgba(251,251,251,0.05)',
                  color: 'rgba(251,251,251,0.9)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} placeholder="e.g., Traviz, Hiace" />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Plate Number</label>
                <input type="text" value={formData.plateNumber} onChange={(e) => setFormData({...formData, plateNumber: e.target.value})} style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(255,212,28,0.3)',
                  borderRadius: '8px',
                  background: 'rgba(251,251,251,0.05)',
                  color: 'rgba(251,251,251,0.9)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} placeholder="e.g., ABC 1234" />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Capacity *</label>
                <input type="number" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})} required min="1" style={{
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
                  {editingShuttle ? 'Update Shuttle' : 'Create Shuttle'}
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