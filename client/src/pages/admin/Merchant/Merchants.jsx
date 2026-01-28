// src/merchant/components/Merchants/MerchantsList.jsx
// Merchant account management - Card-based layout with overview

import React, { useState, useEffect } from 'react';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';

export default function MerchantsList() {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminData] = useState(() => {
    const data = localStorage.getItem('adminData');
    return data ? JSON.parse(data) : null;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState(null);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, merchantId: null });
  const [formData, setFormData] = useState({
    businessName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      const response = await fetch('http://localhost:3000/api/merchant/merchants', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load merchants');

      const data = await response.json();
      setMerchants(data.merchants || []);
    } catch (error) {
      console.error('Error loading merchants:', error);
      setAlert({ type: 'error', message: 'Failed to load merchants' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMerchant(null);
    setFormData({
      businessName: '',
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (merchant) => {
    setEditingMerchant(merchant);
    setFormData({
      businessName: merchant.businessName || '',
      firstName: merchant.firstName || '',
      lastName: merchant.lastName || '',
      email: merchant.email || '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.businessName || formData.businessName.trim().length === 0) {
      setAlert({ type: 'error', message: 'Business name is required' });
      return;
    }

    if (!formData.firstName || formData.firstName.trim().length === 0) {
      setAlert({ type: 'error', message: 'First name is required' });
      return;
    }

    if (!formData.lastName || formData.lastName.trim().length === 0) {
      setAlert({ type: 'error', message: 'Last name is required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      setAlert({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    if (formData.password && !/^\d{6}$/.test(formData.password)) {
      setAlert({ type: 'error', message: 'PIN must be exactly 6 digits' });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');

      if (editingMerchant) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;

        const response = await fetch(`http://localhost:3000/api/merchant/merchants/${editingMerchant._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update merchant');
        }

        setAlert({ type: 'success', message: 'Merchant updated successfully!' });
      } else {
        if (!formData.password) {
          setAlert({ type: 'error', message: 'PIN is required for new merchants' });
          setIsSubmitting(false);
          return;
        }

        console.log('📤 Sending merchant data:', formData);

        const response = await fetch('http://localhost:3000/api/merchant/merchants', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create merchant');
        }

        setAlert({ type: 'success', message: 'Merchant created successfully!' });
      }

      setIsModalOpen(false);
      loadMerchants();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Error saving merchant:', error);
      let errorMsg = 'Failed to save merchant';
      if (error.message.includes('Email already exists') || error.message.includes('409')) {
        errorMsg = 'Email already exists. Please use a different email.';
      } else {
        errorMsg = error.message;
      }
      setAlert({ type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (merchant) => {
    const newStatus = !merchant.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    try {
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`http://localhost:3000/api/merchant/merchants/${merchant._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (!response.ok) throw new Error(`Failed to ${action} merchant`);

      setAlert({ type: 'success', message: `Merchant ${action}d successfully!` });
      loadMerchants();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error(`Error ${action}ing merchant:`, error);
      setAlert({ type: 'error', message: `Failed to ${action} merchant` });
    }
  };

  const handleDeleteClick = (merchantId) => {
    setConfirmDialog({ isOpen: true, merchantId });
  };

  const handleDeleteConfirm = async () => {
    const merchantId = confirmDialog.merchantId;
    setConfirmDialog({ isOpen: false, merchantId: null });

    try {
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`http://localhost:3000/api/merchant/merchants/${merchantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete merchant');

      setAlert({ type: 'success', message: 'Merchant deleted permanently!' });
      setIsModalOpen(false);
      loadMerchants();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Error deleting merchant:', error);
      setAlert({ type: 'error', message: 'Failed to delete merchant' });
    }
  };

  const filteredMerchants = merchants
    .filter(m =>
      m.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.merchantId?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by isActive status (active first)
      if (a.isActive !== b.isActive) {
        return b.isActive ? 1 : -1;
      }
      // Then sort by businessName
      return (a.businessName || '').localeCompare(b.businessName || '');
    });

  // Pagination
  const totalPages = Math.ceil(filteredMerchants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredMerchants.slice(startIndex, endIndex);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#FFD41C'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 212, 28, 0.3)',
          borderTopColor: '#FFD41C',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#FBFBFB',
            margin: '0 0 8px 0'
          }}>
            Merchant Accounts
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'rgba(251, 251, 251, 0.6)',
            margin: 0
          }}>
            {filteredMerchants.length} merchant{filteredMerchants.length !== 1 ? 's' : ''} registered (Page {currentPage} of {totalPages || 1})
          </p>
        </div>
        <button
          onClick={handleAdd}
          style={{
            padding: '12px 24px',
            background: '#FFD41C',
            color: '#181D40',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(255, 212, 28, 0.4)'
          }}
        >
          <span>➕</span>
          <span>Add Merchant</span>
        </button>
      </div>

      {/* Alert */}
      {alert && (
        <div style={{
          padding: '14px 20px',
          background: alert.type === 'success'
            ? 'rgba(16, 185, 129, 0.15)'
            : 'rgba(239, 68, 68, 0.15)',
          border: `2px solid ${alert.type === 'success'
            ? 'rgba(16, 185, 129, 0.3)'
            : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: '12px',
          color: alert.type === 'success' ? '#10B981' : '#EF4444',
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{alert.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Search merchants by name, contact, email, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'rgba(30, 35, 71, 0.5)',
            border: '2px solid rgba(255, 212, 28, 0.3)',
            borderRadius: '10px',
            color: '#FBFBFB',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>

      {/* Merchant Cards Grid - Scrollable Area */}
      <div className="flex-1 overflow-y-auto pr-2">
      {filteredMerchants.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {currentItems.map((merchant) => (
            <MerchantCard
              key={merchant._id}
              merchant={merchant}
              onEdit={handleEdit}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #1E2347 0%, #181D40 100%)',
          borderRadius: '16px',
          border: '2px solid rgba(255, 212, 28, 0.3)',
          padding: '60px',
          textAlign: 'center',
          color: 'rgba(251, 251, 251, 0.5)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏪</div>
          <p style={{ margin: 0, fontSize: '16px' }}>
            {searchQuery ? 'No merchants found matching your search' : 'No merchants yet. Add your first merchant!'}
          </p>
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

      {/* Modal */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 18, 39, 0.9)',
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
              border: '1px solid rgba(255, 212, 28, 0.2)',
              padding: '32px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              animation: 'slideUp 0.3s ease'
            }}
          >
            <h3 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#FBFBFB',
              margin: '0 0 24px 0'
            }}>
              {editingMerchant ? 'Edit Merchant' : 'Add New Merchant'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '16px' }}>
                {editingMerchant && editingMerchant.merchantId && (
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#FFD41C',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Merchant ID
                    </label>
                    <div style={{
                      padding: '12px 16px',
                      background: 'rgba(255, 212, 28, 0.1)',
                      border: '2px solid rgba(255, 212, 28, 0.3)',
                      borderRadius: '8px',
                      color: '#FFD41C',
                      fontSize: '14px',
                      fontWeight: 700
                    }}>
                      {editingMerchant.merchantId}
                    </div>
                  </div>
                )}

                <FormField
                  label="Business Name"
                  value={formData.businessName}
                  onChange={(value) => setFormData({ ...formData, businessName: value })}
                  placeholder="e.g., Canteen 1"
                  required
                />

                <FormField
                  label="First Name"
                  value={formData.firstName}
                  onChange={(value) => setFormData({ ...formData, firstName: value })}
                  placeholder="e.g., Juan"
                  required
                />

                <FormField
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(value) => setFormData({ ...formData, lastName: value })}
                  placeholder="e.g., Dela Cruz"
                  required
                />

                <FormField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(value) => setFormData({ ...formData, email: value })}
                  placeholder="merchant@nu-laguna.edu.ph"
                  required
                />

                {/* PIN Field - Styled like driver password */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#FFD41C',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {editingMerchant ? '6-Digit PIN (leave blank to keep current)' : '6-Digit PIN'} {!editingMerchant && <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow digits
                      if (value === '' || /^\d+$/.test(value)) {
                        setFormData({ ...formData, password: value });
                      }
                    }}
                    required={!editingMerchant}
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
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '24px',
                justifyContent: editingMerchant ? 'space-between' : 'flex-end'
              }}>
                {editingMerchant && (
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(editingMerchant._id)}
                    style={{
                      padding: '12px 24px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '2px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '8px',
                      color: '#EF4444',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    }}
                  >
                    🗑️ Delete Permanently
                  </button>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: '12px 24px',
                      background: 'rgba(255, 212, 28, 0.1)',
                      border: '2px solid rgba(255, 212, 28, 0.3)',
                      borderRadius: '8px',
                      color: '#FFD41C',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '12px 24px',
                      background: isSubmitting ? '#CCCCCC' : '#FFD41C',
                      color: '#181D40',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(255, 212, 28, 0.4)',
                      opacity: isSubmitting ? 0.6 : 1
                    }}
                  >
                    {isSubmitting ? 'Saving...' : (editingMerchant ? 'Update Merchant' : 'Create Merchant')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Merchant"
        message="Are you sure you want to permanently delete this merchant? This action cannot be undone."
        confirmText="Delete Merchant"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, merchantId: null })}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
          }
          50% {
            opacity: 0.7;
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.1);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
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

function MerchantCard({ merchant, onEdit, onToggleActive }) {
  const isActive = merchant.isActive !== false;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1E2347 0%, #181D40 100%)',
      borderRadius: '16px',
      border: '2px solid rgba(255, 212, 28, 0.3)',
      padding: '24px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer',
      opacity: isActive ? 1 : 0.7
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 212, 28, 0.2)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      {/* Header with ID Badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div style={{
          padding: '6px 14px',
          background: 'rgba(255, 212, 28, 0.15)',
          border: '1px solid rgba(255, 212, 28, 0.3)',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#FFD41C'
        }}>
          {merchant.merchantId || 'N/A'}
        </div>
        <div style={{
          width: '12px',
          height: '12px',
          background: isActive ? '#10B981' : '#EF4444',
          borderRadius: '50%',
          boxShadow: `0 0 0 3px ${isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          animation: isActive ? 'pulse 2s ease-in-out infinite' : 'none'
        }} />
      </div>

      {/* Business Name */}
      <h3 style={{
        fontSize: '20px',
        fontWeight: 700,
        color: '#FBFBFB',
        margin: '0 0 8px 0'
      }}>
        {merchant.businessName}
      </h3>

      {/* Contact Info */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '13px',
          color: 'rgba(251, 251, 251, 0.8)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>👤</span>
          <span>{merchant.firstName} {merchant.lastName}</span>
        </div>
        <div style={{
          fontSize: '13px',
          color: 'rgba(251, 251, 251, 0.8)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📧</span>
          <span>{merchant.email}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '8px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255, 212, 28, 0.2)'
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(merchant);
          }}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '8px',
            color: '#3B82F6',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
          }}
        >
          ✏️ Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleActive(merchant);
          }}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: isActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            border: `1px solid ${isActive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            borderRadius: '8px',
            color: isActive ? '#EF4444' : '#10B981',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (isActive) {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
            } else {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (isActive) {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            } else {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
            }
          }}
        >
          {isActive ? '🔴 Deactivate' : '✅ Activate'}
        </button>
      </div>
    </div>
  );
}

function FormField({ label, type = 'text', value, onChange, placeholder, required, maxLength }) {
  return (
    <div>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: '12px',
        fontWeight: 700,
        color: '#FFD41C',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'rgba(251, 251, 251, 0.05)',
          border: '2px solid rgba(255, 212, 28, 0.3)',
          borderRadius: '8px',
          color: '#FBFBFB',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
}
