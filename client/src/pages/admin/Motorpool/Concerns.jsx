// src/pages/admin/Motorpool/Concerns.jsx
// Motorpool-specific concerns - matches Treasury style with inline action buttons
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import SearchBar from '../../../components/shared/SearchBar';
import StatusFilter from '../../../components/shared/StatusFilter';
import DateRangeFilter from '../../../components/shared/DateRangeFilter';
import ExportButton from '../../../components/shared/ExportButton';
import { exportToCSV } from '../../../utils/csvExport';

export default function MotorpoolConcerns() {
  const { theme, isDarkMode } = useTheme();
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'assistance', 'feedback'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const intervalRef = useRef(null);

  const fetchConcerns = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const data = await api.get(`/admin/user-concerns?${params}`);

      if (data?.concerns || Array.isArray(data)) {
        const allConcerns = data.concerns || data;
        // Filter to only show concerns for NU Shuttle Service (Motorpool)
        const motorpoolConcerns = allConcerns.filter(concern =>
          concern.reportTo === 'NU Shuttle Service' ||
          concern.reportTo?.toLowerCase().includes('motorpool') ||
          concern.reportTo?.toLowerCase().includes('shuttle')
        );
        setConcerns(motorpoolConcerns);
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load concerns');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcerns();
    intervalRef.current = setInterval(() => fetchConcerns(true), 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [statusFilter, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, activeTab, startDate, endDate]);

  const handleViewDetails = (concern) => {
    setSelectedConcern(concern);
    setShowDetailsModal(true);
  };

  const handleOpenResolve = (concern) => {
    setSelectedConcern(concern);
    setResolution('');
    setShowDetailsModal(false);
    setShowResolveModal(true);
  };

  const handleStatusChange = async (concern, newStatus) => {
    try {
      if (newStatus === 'resolved') {
        setSelectedConcern(concern);
        setShowResolveModal(true);
        return;
      }

      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      const data = await api.patch(`/admin/user-concerns/${concern.concernId || concern._id}/status`, {
        status: newStatus,
        adminName: adminData.firstName ? `${adminData.firstName} ${adminData.lastName || ''}`.trim() : 'Motorpool Admin'
      });

      if (data?.success) {
        toast.success('Status updated! User has been notified.');
        fetchConcerns(true);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      toast.error('Please provide a resolution message');
      return;
    }

    setResolving(true);
    try {
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      const data = await api.patch(`/admin/user-concerns/${selectedConcern.concernId || selectedConcern._id}/status`, {
        status: 'resolved',
        resolution: resolution.trim(),
        adminName: adminData.firstName ? `${adminData.firstName} ${adminData.lastName || ''}`.trim() : 'Motorpool Admin'
      });

      if (data?.success) {
        toast.success('Concern resolved! User has been notified via email.');
        setShowResolveModal(false);
        fetchConcerns(true);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resolve concern');
    } finally {
      setResolving(false);
    }
  };

  const handleExport = () => {
    const dataToExport = filteredConcerns.map(c => ({
      ID: c.concernId || c._id?.slice(-8) || '',
      Type: c.submissionType || 'assistance',
      User: c.userName || '',
      Subject: c.subject || '',
      Status: c.status || 'pending',
      Priority: c.priority || 'medium',
      Rating: c.rating || '',
      Date: c.submittedAt || c.createdAt ? new Date(c.submittedAt || c.createdAt).toLocaleDateString() : ''
    }));
    exportToCSV(dataToExport, 'motorpool_concerns');
  };

  // Filter concerns
  const filteredConcerns = concerns.filter(concern => {
    // Tab filter
    if (activeTab === 'assistance' && concern.submissionType !== 'assistance') return false;
    if (activeTab === 'feedback' && concern.submissionType !== 'feedback') return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        concern._id?.toLowerCase().includes(query) ||
        concern.concernId?.toLowerCase().includes(query) ||
        concern.subject?.toLowerCase().includes(query) ||
        concern.feedbackText?.toLowerCase().includes(query) ||
        concern.userName?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter && concern.status !== statusFilter) return false;

    // Date range filter
    if (startDate || endDate) {
      const concernDate = new Date(concern.submittedAt || concern.createdAt);
      if (startDate && concernDate < new Date(startDate)) return false;
      if (endDate && concernDate > new Date(endDate + 'T23:59:59')) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredConcerns.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredConcerns.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FBBF24';
      case 'in_progress': return '#3B82F6';
      case 'resolved': return '#10B981';
      default: return theme.text.secondary;
    }
  };

  if (loading) {
    return (
      <div style={{ color: theme.accent.primary }} className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: `${theme.accent.primary} transparent transparent transparent` }} />
        Loading concerns...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-6 border-b-2 pb-5">
        <div className="mb-5">
          <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
            <span>🚐</span> Concerns & Feedback
          </h2>
          <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
            {filteredConcerns.length > 0
              ? `Showing ${startIndex + 1}-${Math.min(startIndex + ITEMS_PER_PAGE, filteredConcerns.length)} of ${filteredConcerns.length} • Page ${currentPage} of ${totalPages}`
              : `Manage motorpool concerns and feedback • Total: ${concerns.length}`
            }
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'all' ? 'rgba(255,212,28,0.2)' : 'transparent',
              border: `2px solid ${activeTab === 'all' ? theme.accent.primary : 'rgba(255,212,28,0.3)'}`,
              borderRadius: '8px',
              color: activeTab === 'all' ? theme.accent.primary : theme.text.secondary,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            All ({concerns.length})
          </button>
          <button
            onClick={() => setActiveTab('assistance')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'assistance' ? 'rgba(59,130,246,0.2)' : 'transparent',
              border: `2px solid ${activeTab === 'assistance' ? '#3B82F6' : 'rgba(59,130,246,0.3)'}`,
              borderRadius: '8px',
              color: activeTab === 'assistance' ? '#3B82F6' : theme.text.secondary,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🆘 Assistance ({concerns.filter(c => c.submissionType === 'assistance' || !c.submissionType).length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'feedback' ? 'rgba(34,197,94,0.2)' : 'transparent',
              border: `2px solid ${activeTab === 'feedback' ? '#22C55E' : 'rgba(34,197,94,0.3)'}`,
              borderRadius: '8px',
              color: activeTab === 'feedback' ? '#22C55E' : theme.text.secondary,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            💬 Feedback ({concerns.filter(c => c.submissionType === 'feedback').length})
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex gap-3 items-end flex-wrap">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by ID, user, subject..."
          />
          {activeTab !== 'feedback' && (
            <StatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              label="Status"
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' }
              ]}
            />
          )}
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
          <ExportButton onClick={handleExport} disabled={filteredConcerns.length === 0} />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filteredConcerns.length === 0 ? (
          <div style={{ color: theme.text.tertiary }} className="text-center py-20">
            <div className="text-5xl mb-4">🚐</div>
            <p>No concerns found</p>
          </div>
        ) : (
          <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border overflow-hidden">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ background: isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)' }}>
                  <th style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)', color: theme.accent.primary }}
                      className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">ID</th>
                  <th style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)', color: theme.accent.primary }}
                      className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">User</th>
                  <th style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)', color: theme.accent.primary }}
                      className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">Subject</th>
                  {activeTab === 'all' && (
                    <th style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)', color: theme.accent.primary }}
                        className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">Type</th>
                  )}
                  {activeTab === 'feedback' ? (
                    <th style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)', color: theme.accent.primary }}
                        className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">Rating</th>
                  ) : (
                    <th style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)', color: theme.accent.primary }}
                        className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">Status</th>
                  )}
                  <th style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)', color: theme.accent.primary }}
                      className="text-left p-4 text-[11px] font-extrabold uppercase border-b-2">Date</th>
                  <th style={{ borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)', color: theme.accent.primary }}
                      className="text-right p-4 text-[11px] font-extrabold uppercase border-b-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((concern) => (
                  <tr key={concern._id} style={{ borderBottom: `1px solid ${theme.border.primary}` }} className="hover:bg-white/5 transition">
                    <td style={{ color: theme.text.primary }} className="p-4 font-mono text-xs">
                      {concern.concernId || concern._id?.slice(-8)}
                    </td>
                    <td style={{ color: theme.text.primary }} className="p-4">
                      {concern.userName || 'N/A'}
                    </td>
                    <td style={{ color: theme.text.primary }} className="p-4 max-w-[200px] truncate">
                      {concern.subject || (concern.selectedConcerns?.length > 0 ? concern.selectedConcerns.join(', ') : 'No subject')}
                    </td>
                    {activeTab === 'all' && (
                      <td className="p-4">
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: concern.submissionType === 'feedback' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)',
                          color: concern.submissionType === 'feedback' ? '#22C55E' : '#3B82F6',
                          border: `1px solid ${concern.submissionType === 'feedback' ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
                        }}>
                          {concern.submissionType === 'feedback' ? '💬 Feedback' : '🆘 Assistance'}
                        </span>
                      </td>
                    )}
                    {activeTab === 'feedback' ? (
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} style={{
                              fontSize: '14px',
                              color: i < (concern.rating || 0) ? '#FFD41C' : 'rgba(255,212,28,0.2)'
                            }}>
                              ⭐
                            </span>
                          ))}
                          <span style={{ color: theme.text.muted, marginLeft: '8px', fontSize: '11px' }}>
                            ({concern.rating || 0}/5)
                          </span>
                        </div>
                      </td>
                    ) : (
                      <td className="p-4">
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: `${getStatusColor(concern.status)}20`,
                          color: getStatusColor(concern.status),
                        }}>
                          {concern.status?.replace('_', ' ') || 'Pending'}
                        </span>
                      </td>
                    )}
                    <td style={{ color: theme.text.secondary }} className="p-4 text-sm">
                      {concern.submittedAt || concern.createdAt ? new Date(concern.submittedAt || concern.createdAt).toLocaleDateString() : ''}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleViewDetails(concern)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(59,130,246,0.2)',
                            color: '#3B82F6',
                            border: '1px solid rgba(59,130,246,0.3)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          View
                        </button>
                        {activeTab !== 'feedback' && concern.status !== 'resolved' && (
                          <>
                            {concern.status !== 'in_progress' && (
                              <button
                                onClick={() => handleStatusChange(concern, 'in_progress')}
                                style={{
                                  padding: '6px 12px',
                                  background: 'rgba(59,130,246,0.2)',
                                  color: '#3B82F6',
                                  border: '2px solid #3B82F6',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 700
                                }}
                              >
                                In Progress
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenResolve(concern)}
                              style={{
                                padding: '6px 12px',
                                background: '#10B981',
                                color: '#FFFFFF',
                                border: '2px solid #10B981',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 700
                              }}
                            >
                              Resolve
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ borderColor: theme.border.primary }} className="p-4 border-t flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    background: currentPage === 1 ? 'rgba(100,100,100,0.2)' : theme.bg.tertiary,
                    color: currentPage === 1 ? theme.text.muted : theme.accent.primary,
                    border: `2px solid ${currentPage === 1 ? 'transparent' : theme.accent.primary}`,
                    borderRadius: '8px',
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
                    background: currentPage === totalPages ? 'rgba(100,100,100,0.2)' : theme.bg.tertiary,
                    color: currentPage === totalPages ? theme.text.muted : theme.accent.primary,
                    border: `2px solid ${currentPage === totalPages ? 'transparent' : theme.accent.primary}`,
                    borderRadius: '8px',
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

      {/* Details Modal */}
      {showDetailsModal && selectedConcern && (
        <div
          onClick={() => setShowDetailsModal(false)}
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
            justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDarkMode ? 'linear-gradient(135deg, #1a1f3a 0%, #0f1227 100%)' : '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '85vh',
              overflow: 'auto',
              border: `2px solid ${theme.border.primary}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          >
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: `2px solid ${theme.border.primary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: `${getStatusColor(selectedConcern.status)}20`,
                  color: getStatusColor(selectedConcern.status),
                  marginBottom: '8px'
                }}>
                  {selectedConcern.status?.replace('_', ' ') || 'Pending'}
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: theme.text.primary, margin: 0 }}>
                  {selectedConcern.subject || (selectedConcern.selectedConcerns?.length > 0 ? selectedConcern.selectedConcerns.join(', ') : 'No Subject')}
                </h2>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  background: 'rgba(239,68,68,0.2)',
                  border: 'none',
                  color: '#EF4444',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* User Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: theme.accent.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', color: theme.accent.secondary }}>
                  {selectedConcern.userName?.[0] || '?'}
                </div>
                <div>
                  <p style={{ color: theme.text.primary, fontWeight: 600, margin: 0 }}>
                    {selectedConcern.userName || 'Unknown User'}
                  </p>
                  <p style={{ color: theme.text.secondary, fontSize: '13px', margin: 0 }}>
                    {selectedConcern.userEmail || 'No email provided'}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ color: theme.text.muted, fontSize: '12px', margin: 0 }}>
                    {selectedConcern.submittedAt || selectedConcern.createdAt ? new Date(selectedConcern.submittedAt || selectedConcern.createdAt).toLocaleString() : ''}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div style={{ background: theme.bg.tertiary, borderRadius: '12px', padding: '16px', marginBottom: '20px', border: `1px solid ${theme.border.primary}` }}>
                <p style={{ color: theme.text.primary, whiteSpace: 'pre-wrap', margin: 0, lineHeight: '1.6' }}>
                  {selectedConcern.feedbackText || selectedConcern.description || 'No message provided'}
                </p>
              </div>

              {/* Rating if feedback */}
              {selectedConcern.submissionType === 'feedback' && selectedConcern.rating && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ color: theme.text.secondary, fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}>Rating</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ fontSize: '24px', color: i < selectedConcern.rating ? '#FFD41C' : 'rgba(255,212,28,0.2)' }}>
                        ⭐
                      </span>
                    ))}
                    <span style={{ color: theme.text.secondary, marginLeft: '8px' }}>
                      ({selectedConcern.rating}/5)
                    </span>
                  </div>
                </div>
              )}

              {/* Admin Response if exists */}
              {(selectedConcern.resolution || selectedConcern.adminResponse) && (
                <div style={{ background: 'rgba(16,185,129,0.1)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <p style={{ color: '#10B981', fontSize: '12px', marginBottom: '8px', fontWeight: 700 }}>Admin Response</p>
                  <p style={{ color: theme.text.primary, margin: 0 }}>
                    {selectedConcern.resolution || selectedConcern.adminResponse}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {selectedConcern.status !== 'resolved' && selectedConcern.submissionType !== 'feedback' && (
              <div style={{ padding: '20px 24px', borderTop: `2px solid ${theme.border.primary}`, display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                {selectedConcern.status !== 'in_progress' && (
                  <button
                    onClick={() => { handleStatusChange(selectedConcern, 'in_progress'); setShowDetailsModal(false); }}
                    style={{
                      padding: '12px 24px',
                      background: 'rgba(59,130,246,0.2)',
                      color: '#3B82F6',
                      border: '2px solid #3B82F6',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 700
                    }}
                  >
                    Mark In Progress
                  </button>
                )}
                <button
                  onClick={() => { setShowDetailsModal(false); handleOpenResolve(selectedConcern); }}
                  style={{
                    padding: '12px 24px',
                    background: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(16,185,129,0.4)'
                  }}
                >
                  ✓ Resolve Concern
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && selectedConcern && (
        <div
          onClick={() => setShowResolveModal(false)}
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
            justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDarkMode ? 'linear-gradient(135deg, #1a1f3a 0%, #0f1227 100%)' : '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              border: `2px solid ${theme.border.primary}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          >
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: `2px solid rgba(16,185,129,0.3)`, background: 'rgba(16,185,129,0.1)', borderRadius: '16px 16px 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#10B981', margin: 0, marginBottom: '8px' }}>
                    Resolve Concern
                  </h2>
                  <p style={{ fontSize: '13px', color: theme.text.secondary, margin: 0 }}>
                    Mark this concern as resolved and notify the user
                  </p>
                </div>
                <button
                  onClick={() => setShowResolveModal(false)}
                  style={{
                    background: 'rgba(239,68,68,0.2)',
                    border: 'none',
                    color: '#EF4444',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '24px' }}>
              {/* Concern Info */}
              <div style={{ background: theme.bg.tertiary, borderRadius: '12px', padding: '16px', marginBottom: '20px', border: `1px solid ${theme.border.primary}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: theme.text.secondary, fontSize: '12px' }}>From</span>
                  <span style={{ color: theme.text.primary, fontSize: '14px', fontWeight: 600 }}>
                    {selectedConcern.userName || 'Unknown User'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: theme.text.secondary, fontSize: '12px' }}>Subject</span>
                  <span style={{ color: theme.text.primary, fontSize: '14px', fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>
                    {selectedConcern.subject || (selectedConcern.selectedConcerns?.length > 0 ? selectedConcern.selectedConcerns.join(', ') : 'No Subject')}
                  </span>
                </div>
              </div>

              {/* Resolution Input */}
              <div>
                <label style={{ color: theme.text.primary, fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Resolution Message <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <p style={{ color: theme.text.secondary, fontSize: '13px', marginBottom: '12px' }}>
                  This message will be sent to the user via email.
                </p>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Enter your resolution response..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `2px solid ${theme.border.primary}`,
                    background: theme.bg.tertiary,
                    color: theme.text.primary,
                    fontSize: '14px',
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '20px 24px', borderTop: `2px solid ${theme.border.primary}`, display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowResolveModal(false)}
                disabled={resolving}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: theme.bg.tertiary,
                  color: theme.text.primary,
                  border: `1px solid ${theme.border.primary}`,
                  borderRadius: '8px',
                  cursor: resolving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  opacity: resolving ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving || !resolution.trim()}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: resolving || !resolution.trim() ? 'rgba(16,185,129,0.3)' : '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: resolving || !resolution.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 700,
                  opacity: resolving || !resolution.trim() ? 0.6 : 1,
                  boxShadow: resolving || !resolution.trim() ? 'none' : '0 4px 12px rgba(16,185,129,0.4)'
                }}
              >
                {resolving ? '⏳ Resolving...' : '✓ Resolve & Notify User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
