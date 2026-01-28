// src/pages/admin/Merchant/Phones.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import SearchBar from '../../../components/shared/SearchBar';
import ExportButton from '../../../components/shared/ExportButton';
import { exportToCSV, prepareDataForExport } from '../../../utils/csvExport';

export default function MerchantPhonesList() {
  const [phones, setPhones] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPhone, setEditingPhone] = useState(null);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [formData, setFormData] = useState({
    phoneId: '',
    phoneModel: '',
    phoneType: 'Android',
    assignedMerchantId: '',
    assignedBusinessName: '',
    status: 'available',
    notes: ''
  });

  const loadPhones = async () => {
    try {
      const data = await api.get('/merchant/phones');
      setPhones(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading phones:', error);
      setLoading(false);
    }
  };

  const loadMerchants = async () => {
    try {
      const data = await api.get('/merchant/merchants');
      setMerchants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading merchants:', error);
    }
  };

  useEffect(() => {
    loadPhones();
    loadMerchants();
    const interval = setInterval(loadPhones, 5000);
    return () => clearInterval(interval);
  }, []);

  const getNextPhoneId = () => {
    if (phones.length === 0) return 'PHONE_001';

    let highestNum = 0;
    for (const phone of phones) {
      if (phone.phoneId) {
        const match = phone.phoneId.match(/PHONE_(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > highestNum) highestNum = num;
        }
      }
    }

    return `PHONE_${String(highestNum + 1).padStart(3, '0')}`;
  };

  const handleMerchantChange = (merchantId) => {
    if (!merchantId) {
      setFormData({
        ...formData,
        assignedMerchantId: '',
        assignedBusinessName: '',
        status: 'available',
        assignedMerchantDate: null
      });
    } else {
      const merchant = merchants.find(m => m.merchantId === merchantId);
      setFormData({
        ...formData,
        assignedMerchantId: merchantId,
        assignedBusinessName: merchant?.businessName || '',
        status: 'assigned',
        assignedMerchantDate: new Date()
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPhone) {
        await api.put(`/merchant/phones/${editingPhone._id}`, formData);
        setAlert({ type: 'success', message: 'Phone updated successfully!' });
      } else {
        const newPhoneId = getNextPhoneId();
        await api.post('/merchant/phones', { ...formData, phoneId: newPhoneId });
        setAlert({ type: 'success', message: 'Phone created successfully!' });
      }
      setShowModal(false);
      setEditingPhone(null);
      resetForm();
      loadPhones();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Failed to save phone' });
    }
  };

  const handleEdit = (phone) => {
    setEditingPhone(phone);
    setFormData({
      phoneId: phone.phoneId,
      phoneModel: phone.phoneModel,
      phoneType: phone.phoneType,
      assignedMerchantId: phone.assignedMerchantId || '',
      assignedBusinessName: phone.assignedBusinessName || '',
      status: phone.status,
      notes: phone.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this phone?')) return;
    try {
      await api.delete(`/merchant/phones/${id}`);
      setAlert({ type: 'success', message: 'Phone deleted successfully!' });
      loadPhones();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.error || 'Failed to delete phone' });
    }
  };

  const handleMerchantAssignment = async (phone, newMerchantId) => {
    try {
      const merchant = merchants.find(m => m.merchantId === newMerchantId);
      const updatedPhone = {
        ...phone,
        assignedMerchantId: newMerchantId || null,
        assignedBusinessName: merchant?.businessName || null,
        assignedMerchantDate: newMerchantId ? new Date() : null,
        status: newMerchantId ? 'assigned' : 'available'
      };
      await api.put(`/merchant/phones/${phone._id}`, updatedPhone);
      setAlert({ type: 'success', message: 'Merchant assignment updated!' });
      loadPhones();
      setTimeout(() => setAlert(null), 2000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update assignment' });
    }
  };

  const resetForm = () => {
    setFormData({
      phoneId: '',
      phoneModel: '',
      phoneType: 'Android',
      assignedMerchantId: '',
      assignedBusinessName: '',
      status: 'available',
      notes: ''
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return { bg: 'rgba(34,197,94,0.2)', color: '#22C55E' };
      case 'assigned': return { bg: 'rgba(59,130,246,0.2)', color: '#3B82F6' };
      case 'maintenance': return { bg: 'rgba(251,191,36,0.2)', color: '#FBBF24' };
      case 'retired': return { bg: 'rgba(239,68,68,0.2)', color: '#EF4444' };
      default: return { bg: 'rgba(107,114,128,0.2)', color: '#6B7280' };
    }
  };

  const handleExport = () => {
    const dataToExport = prepareDataForExport(filteredPhones);
    exportToCSV(dataToExport, 'merchant-phones');
  };

  const filteredPhones = phones.filter(phone => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      phone.phoneId?.toLowerCase().includes(searchLower) ||
      phone.phoneModel?.toLowerCase().includes(searchLower) ||
      phone.phoneType?.toLowerCase().includes(searchLower) ||
      phone.assignedBusinessName?.toLowerCase().includes(searchLower) ||
      phone.assignedMerchantId?.toLowerCase().includes(searchLower) ||
      phone.status?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredPhones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredPhones.slice(startIndex, endIndex);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return <div className="text-center py-[60px] text-[#FFD41C]">Loading phones...</div>;
  }

  return (
    <div className="h-full flex flex-col">
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
      <div className="mb-[30px] border-b-2 border-[rgba(255,212,28,0.2)] pb-5">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 className="text-2xl font-bold text-[#FFD41C] m-0 mb-2 flex items-center gap-[10px]">
              <span>📱</span> Merchant Phone Inventory
            </h2>
            <p className="text-[13px] text-[rgba(251,251,251,0.6)] m-0">
              {searchQuery
                ? `Showing: ${filteredPhones.length} of ${phones.length} (Page ${currentPage} of ${totalPages || 1})`
                : `Total devices: ${phones.length} • Available: ${phones.filter(p => p.status === 'available').length} • Assigned: ${phones.filter(p => p.status === 'assigned').length} (Page ${currentPage} of ${totalPages || 1})`}
            </p>
          </div>
          <button onClick={() => { resetForm(); setEditingPhone(null); setShowModal(true); }} style={{
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
            + Add Phone
          </button>
        </div>
        <div className="flex gap-3 items-center">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by phone ID, model, serial, or merchant..."
          />
          <ExportButton onClick={handleExport} disabled={filteredPhones.length === 0} />
        </div>
      </div>

      {/* Table - Scrollable Area */}
      <div className="flex-1 overflow-y-auto pr-2">
      {phones.length === 0 ? (
        <div className="text-center py-[60px] text-[rgba(251,251,251,0.5)]">
          <div className="text-5xl mb-4">📱</div>
          <div>No phones found</div>
        </div>
      ) : filteredPhones.length === 0 ? (
        <div className="text-center py-[60px] text-[rgba(251,251,251,0.5)]">
          <div className="text-5xl mb-4">🔍</div>
          <div style={{ marginBottom: '12px' }}>No phones match your search</div>
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
        <div className="overflow-x-auto rounded-xl border border-[rgba(255,212,28,0.2)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[rgba(255,212,28,0.1)]">
                <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Phone ID</th>
                <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Device</th>
                <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Type</th>
                <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Assigned Merchant</th>
                <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Status</th>
                <th style={{ textAlign: 'right', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((phone) => {
                const statusStyle = getStatusColor(phone.status);
                return (
                  <tr key={phone._id} style={{ borderBottom: '1px solid rgba(255,212,28,0.1)' }}>
                    <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                      <strong>{phone.phoneId}</strong>
                    </td>
                    <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                      {phone.phoneModel}
                    </td>
                    <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                      {phone.phoneType}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <select
                        value={phone.assignedMerchantId || ''}
                        onChange={(e) => handleMerchantAssignment(phone, e.target.value)}
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(255,212,28,0.1)',
                          color: '#FFD41C',
                          border: '1px solid rgba(255,212,28,0.3)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          minWidth: '200px'
                        }}
                      >
                        <option value="">Unassigned</option>
                        {merchants.map(merchant => (
                          <option key={merchant.merchantId} value={merchant.merchantId}>
                            {merchant.businessName} ({merchant.merchantId})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '6px 12px',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        display: 'inline-block'
                      }}>
                        {phone.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => handleEdit(phone)} style={{
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
                      <button onClick={() => handleDelete(phone._id)} style={{
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '2px solid rgba(255,212,28,0.2)'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '10px 20px',
                background: currentPage === 1 ? 'rgba(255,212,28,0.1)' : 'rgba(255,212,28,0.2)',
                border: '2px solid rgba(255,212,28,0.3)',
                borderRadius: '8px',
                color: currentPage === 1 ? 'rgba(255,212,28,0.5)' : '#FFD41C',
                fontSize: '14px',
                fontWeight: 600,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ← Previous
            </button>
            <span style={{
              color: 'rgba(251,251,251,0.8)',
              fontSize: '14px',
              fontWeight: 600,
              minWidth: '120px',
              textAlign: 'center'
            }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '10px 20px',
                background: currentPage === totalPages ? 'rgba(255,212,28,0.1)' : 'rgba(255,212,28,0.2)',
                border: '2px solid rgba(255,212,28,0.3)',
                borderRadius: '8px',
                color: currentPage === totalPages ? 'rgba(255,212,28,0.5)' : '#FFD41C',
                fontSize: '14px',
                fontWeight: 600,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Next →
            </button>
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
                {editingPhone ? 'Edit Phone' : 'Add New Phone'}
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
                  Phone ID {!editingPhone && <span style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', fontWeight: 400 }}>(Auto-generated)</span>}
                </label>
                <input
                  type="text"
                  value={editingPhone ? formData.phoneId : getNextPhoneId()}
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
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Phone Model *</label>
                <input type="text" value={formData.phoneModel} onChange={(e) => setFormData({...formData, phoneModel: e.target.value})} required style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(255,212,28,0.3)',
                  borderRadius: '8px',
                  background: 'rgba(251,251,251,0.05)',
                  color: 'rgba(251,251,251,0.9)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} placeholder="e.g., Samsung Galaxy A14" />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Phone Type *</label>
                <select value={formData.phoneType} onChange={(e) => setFormData({...formData, phoneType: e.target.value})} required style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(255,212,28,0.3)',
                  borderRadius: '8px',
                  background: 'rgba(251,251,251,0.05)',
                  color: 'rgba(251,251,251,0.9)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}>
                  <option value="Android">Android</option>
                  <option value="iOS">iOS</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Assign to Merchant</label>
                <select value={formData.assignedMerchantId} onChange={(e) => handleMerchantChange(e.target.value)} style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid rgba(255,212,28,0.3)',
                  borderRadius: '8px',
                  background: 'rgba(251,251,251,0.05)',
                  color: 'rgba(251,251,251,0.9)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}>
                  <option value="">Unassigned</option>
                  {merchants.map(merchant => (
                    <option key={merchant.merchantId} value={merchant.merchantId}>
                      {merchant.businessName} ({merchant.merchantId})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#FFD41C', textTransform: 'uppercase' }}>Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows="3" style={{
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
                }} placeholder="Any additional notes about this device" />
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
                  {editingPhone ? 'Update Phone' : 'Create Phone'}
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
