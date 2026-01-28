// src/admin/components/Drivers/DriversList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import SearchBar from '../common/SearchBar';
import ExportButton from '../common/ExportButton';
import { exportToCSV, prepareDataForExport } from '../../utils/csvExport';

export default function DriversList() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [formData, setFormData] = useState({
    driverId: '',
    firstName: '',
    lastName: '',
    middleInitial: '',
    email: '',
    password: '',
    shuttleId: '',
    licenseNumber: '',
    licenseExpiry: ''
  });

  const loadDrivers = async () => {
    try {
      const data = await api.get('/admin/drivers');
      setDrivers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading drivers:', error);
      setAlert({ type: 'error', message: 'Failed to load drivers' });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
    const interval = setInterval(loadDrivers, 5000);
    return () => clearInterval(interval);
  }, []);

  const getNextDriverId = () => {
  if (drivers.length === 0) return 'DRV001';
  
  let highestNum = 0;
  for (const driver of drivers) {
    if (driver.driverId) {
      const match = driver.driverId.match(/DRV(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNum) highestNum = num;
      }
    }
  }
  
  return `DRV${String(highestNum + 1).padStart(3, '0')}`;
};

  const openAddModal = () => {
    setEditingDriver(null);
    setFormData({
      driverId: getNextDriverId(),
      firstName: '',
      lastName: '',
      middleInitial: '',
      email: '',
      password: '',
      shuttleId: '',
      licenseNumber: '',
      licenseExpiry: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setFormData({
      driverId: driver.driverId,
      firstName: driver.firstName,
      lastName: driver.lastName,
      middleInitial: driver.middleInitial || '',
      email: driver.email,
      password: '', // Don't show PIN
      shuttleId: driver.shuttleId || '',
      licenseNumber: driver.licenseNumber || '',
      licenseExpiry: driver.licenseExpiry ? driver.licenseExpiry.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate first name
    if (!formData.firstName || formData.firstName.trim().length === 0) {
      setAlert({ type: 'error', message: 'First name is required' });
      return;
    }

    // Validate last name
    if (!formData.lastName || formData.lastName.trim().length === 0) {
      setAlert({ type: 'error', message: 'Last name is required' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      setAlert({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    // Validate PIN format
    if (formData.password && !/^\d{6}$/.test(formData.password)) {
      setAlert({ type: 'error', message: 'PIN must be exactly 6 digits' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDriver) {
        // UPDATE
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password; // Don't update if blank

        await api.put(`/admin/drivers/${editingDriver._id}`, updateData);
        setAlert({ type: 'success', message: 'Driver updated successfully!' });
      } else {
        // CREATE
        if (!formData.password) {
          setAlert({ type: 'error', message: 'PIN is required for new drivers' });
          setIsSubmitting(false);
          return;
        }
        await api.post('/admin/drivers', formData);
        setAlert({ type: 'success', message: 'Driver created successfully!' });
      }

      setIsModalOpen(false);
      loadDrivers();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Error saving driver:', error);
      // Better error messages
      let errorMsg = 'Failed to save driver';
      if (error.response?.status === 409) {
        errorMsg = 'Email already exists. Please use a different email.';
      } else if (error.response?.status === 400) {
        errorMsg = error.response?.data?.error || 'Invalid driver data. Please check all fields.';
      } else if (error.response?.status === 500) {
        errorMsg = 'Server error. Please try again later.';
      } else if (error.message?.includes('Network')) {
        errorMsg = 'Network error. Please check your connection.';
      }
      setAlert({ type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (driver) => {
    if (!window.confirm(`Delete driver ${driver.fullName}? This cannot be undone.`)) {
      return;
    }
    
    try {
      await api.delete(`/admin/drivers/${driver._id}`);
      setAlert({ type: 'success', message: 'Driver deleted successfully!' });
      loadDrivers();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Error deleting driver:', error);
      setAlert({ type: 'error', message: 'Failed to delete driver' });
    }
  };

  const handleStatusChange = async (driver, newStatus) => {
    try {
      await api.put(`/admin/drivers/${driver._id}`, { isActive: newStatus === 'active' });
      setAlert({ type: 'success', message: 'Status updated!' });
      loadDrivers();
      setTimeout(() => setAlert(null), 2000);
    } catch (error) {
      console.error('Error updating status:', error);
      setAlert({ type: 'error', message: 'Failed to update status' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // For PIN field, only allow numbers and max 6 digits
    if (name === 'password') {
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleExport = () => {
    const dataToExport = prepareDataForExport(filteredDrivers);
    exportToCSV(dataToExport, 'drivers');
  };

  // Filter drivers based on search query
  const filteredDrivers = drivers.filter(driver => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    const fullName = `${driver.firstName} ${driver.lastName}`.toLowerCase();

    return (
      driver.driverId?.toLowerCase().includes(searchLower) ||
      driver.firstName?.toLowerCase().includes(searchLower) ||
      driver.lastName?.toLowerCase().includes(searchLower) ||
      fullName.includes(searchLower) ||
      driver.email?.toLowerCase().includes(searchLower) ||
      driver.shuttleId?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredDrivers.slice(startIndex, endIndex);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#FFD41C' }}>Loading drivers...</div>;
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#FFD41C', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>👥</span> Driver Management
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(251,251,251,0.6)', margin: 0 }}>
              {filteredDrivers.length > 0
                ? `Showing ${startIndex + 1}-${Math.min(endIndex, filteredDrivers.length)} of ${filteredDrivers.length} • Page ${currentPage} of ${totalPages}`
                : `Total: ${drivers.length} drivers`
              }
            </p>
          </div>
          <button onClick={openAddModal} style={{
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
            + Add Driver
          </button>
        </div>

        {/* Search and Export Row */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, ID, email, or shuttle..."
          />
          <ExportButton onClick={handleExport} disabled={filteredDrivers.length === 0} />
        </div>
      </div>

      {/* Table - Scrollable Area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
      {filteredDrivers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(251,251,251,0.5)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <div>{searchQuery ? 'No drivers match your search' : 'No drivers found'}</div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                background: 'rgba(255, 212, 28, 0.15)',
                border: '2px solid rgba(255, 212, 28, 0.4)',
                borderRadius: '8px',
                color: '#FFD41C',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,212,28,0.2)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,212,28,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Driver ID</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Shuttle</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((driver) => (
                <tr key={driver._id} style={{ borderBottom: '1px solid rgba(255,212,28,0.1)' }}>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    <strong>{driver.driverId}</strong>
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    {driver.fullName || `${driver.firstName} ${driver.lastName}`}
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    {driver.email}
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    {driver.shuttleId || 'None'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <select 
                      value={driver.isActive ? 'active' : 'inactive'}
                      onChange={(e) => handleStatusChange(driver, e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        border: 'none',
                        cursor: 'pointer',
                        background: driver.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                        color: driver.isActive ? '#22C55E' : '#EF4444',
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button onClick={() => openEditModal(driver)} style={{
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
                    <button onClick={() => handleDelete(driver)} style={{
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
      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)} style={{
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
                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{
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
                  Driver ID {!editingDriver && <span style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', fontWeight: 400 }}>(Auto-generated)</span>}
                </label>
                <input type="text" name="driverId" value={formData.driverId} disabled style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(255,212,28,0.2)',
                  borderRadius: '8px',
                  background: 'rgba(100,100,100,0.2)',
                  color: 'rgba(251,251,251,0.5)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  cursor: 'not-allowed'
                }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required style={{
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
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required style={{
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
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>M.I.</label>
                  <input type="text" name="middleInitial" value={formData.middleInitial} onChange={handleInputChange} maxLength="1" style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid rgba(255,212,28,0.3)',
                    borderRadius: '8px',
                    background: 'rgba(251,251,251,0.05)',
                    color: 'rgba(251,251,251,0.9)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    textTransform: 'uppercase'
                  }} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={{
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
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>
                  6-Digit PIN {editingDriver && <span style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', fontWeight: 400 }}>(leave blank to keep current)</span>}
                </label>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingDriver}
                  maxLength="6"
                  placeholder="123456"
                  pattern="\d{6}"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid rgba(255,212,28,0.3)',
                    borderRadius: '8px',
                    background: 'rgba(251,251,251,0.05)',
                    color: 'rgba(251,251,251,0.9)',
                    fontSize: '18px',
                    boxSizing: 'border-box',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontWeight: 700
                  }}
                />
                <p style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginTop: '8px', marginBottom: 0 }}>
                  Numbers only, exactly 6 digits
                </p>
              </div>

              {/* License Information */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>
                  Driver's License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., N12-34-567890"
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

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>
                  License Expiry Date
                </label>
                <input
                  type="date"
                  name="licenseExpiry"
                  value={formData.licenseExpiry}
                  onChange={handleInputChange}
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

              {/* Modal Footer */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '2px solid rgba(255,212,28,0.2)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{
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
                <button type="submit" disabled={isSubmitting} style={{
                  padding: '12px 24px',
                  background: isSubmitting ? '#CCCCCC' : '#FFD41C',
                  color: '#181D40',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(255,212,28,0.4)',
                  opacity: isSubmitting ? 0.6 : 1
                }}>
                  {isSubmitting ? 'Saving...' : (editingDriver ? 'Update Driver' : 'Create Driver')}
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