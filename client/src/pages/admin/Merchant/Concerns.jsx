// src/pages/admin/Merchant/Concerns.jsx
// Merchant-specific concerns - shows only concerns reported to Merchant Office
import React, { useState, useEffect } from 'react';
import { getConcerns, getConcernDetails, updateConcernStatus } from '../../../services/concernsApi';
import SearchBar from '../../../components/shared/SearchBar';
import ExportButton from '../../../components/shared/ExportButton';
import StatusFilter from '../../../components/shared/StatusFilter';
import DateRangeFilter from '../../../components/shared/DateRangeFilter';
import ConcernDetailModal from '../../../components/modals/ConcernDetailModal';
import { exportToCSV, prepareDataForExport } from '../../../utils/csvExport';

export default function MerchantConcerns() {
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'assistance', 'feedback'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const loadConcerns = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await getConcerns({
        page: 1,
        limit: 1000
      });
      if (res.success) {
        // Filter to only show concerns for Merchant Office
        const merchantConcerns = (res.concerns || []).filter(concern =>
          concern.reportTo === 'Merchant Office'
        );
        setConcerns(merchantConcerns);
      }
    } catch (error) {
      console.error('Error loading merchant concerns:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadConcerns(false); // Initial load with spinner
    const interval = setInterval(() => loadConcerns(true), 5000); // Silent refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleViewDetails = async (concernId) => {
    try {
      const res = await getConcernDetails(concernId);
      if (res.success) {
        setSelectedConcern(res.concern);
        setShowDetailsModal(true);
      }
    } catch {
      setAlert({ type: 'error', message: 'Failed to load concern details' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleOpenResolve = (concern) => {
    setSelectedConcern(concern);
    setResolution('');
    setShowDetailsModal(false);
    setShowResolveModal(true);
  };

  const handleStatusChange = async (concern, newStatus) => {
    try {
      // If changing to 'resolved', require resolution text
      if (newStatus === 'resolved') {
        setSelectedConcern(concern);
        setShowResolveModal(true);
        return;
      }

      const res = await updateConcernStatus(concern.concernId, { status: newStatus });
      if (res.success) {
        setAlert({ type: 'success', message: 'Status updated!' });
        loadConcerns(true); // Silent refresh after status change
        setTimeout(() => setAlert(null), 2000);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setAlert({ type: 'error', message: error.message || 'Failed to update status' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      const res = await updateConcernStatus(selectedConcern.concernId, {
        status: 'resolved',
        resolution: resolution.trim() || 'No resolution details provided.'
      });
      if (res.success) {
        setAlert({ type: 'success', message: 'Concern resolved and email sent' });
        setShowResolveModal(false);
        loadConcerns(true); // Silent refresh after resolving
        setTimeout(() => setAlert(null), 2000);
      }
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to resolve concern' });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setResolving(false);
    }
  };

  const handleExport = () => {
    const dataToExport = prepareDataForExport(filteredConcerns);
    exportToCSV(dataToExport, 'merchant_concerns');
  };

  const filteredConcerns = concerns.filter(concern => {
    // Tab filter - filter by submissionType
    if (activeTab === 'assistance' && concern.submissionType !== 'assistance') return false;
    if (activeTab === 'feedback' && concern.submissionType !== 'feedback') return false;

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        concern.concernId?.toLowerCase().includes(searchLower) ||
        concern._id?.toLowerCase().includes(searchLower) ||
        concern.userName?.toLowerCase().includes(searchLower) ||
        concern.userId?.toLowerCase().includes(searchLower) ||
        concern.title?.toLowerCase().includes(searchLower) ||
        concern.description?.toLowerCase().includes(searchLower) ||
        concern.category?.toLowerCase().includes(searchLower) ||
        concern.subject?.toLowerCase().includes(searchLower) ||
        concern.feedbackText?.toLowerCase().includes(searchLower) ||
        concern.priority?.toLowerCase().includes(searchLower) ||
        concern.status?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter && concern.status !== statusFilter) return false;

    // Priority filter
    if (priorityFilter && concern.priority !== priorityFilter) return false;

    // Category filter
    if (categoryFilter && concern.category !== categoryFilter) return false;

    // Date range filter
    if (startDate || endDate) {
      const concernDate = new Date(concern.submittedAt || concern.createdAt);
      if (startDate && concernDate < new Date(startDate)) return false;
      if (endDate && concernDate > new Date(endDate + 'T23:59:59')) return false;
    }

    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredConcerns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredConcerns.slice(startIndex, endIndex);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, priorityFilter, categoryFilter, startDate, endDate, activeTab]);

  if (loading) {
    return <div className="text-center py-[60px] text-[#FFD41C]">Loading merchant concerns...</div>;
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
        }}>
          {alert.message}
        </div>
      )}

      <div className="mb-[30px] border-b-2 border-[rgba(255,212,28,0.2)] pb-5">
        <div style={{ marginBottom: '20px' }}>
          <h2 className="text-2xl font-bold text-[#FFD41C] m-0 mb-2 flex items-center gap-[10px]">
            <span>🏪</span> Merchant Concerns
          </h2>
          <p className="text-[13px] text-[rgba(251,251,251,0.6)] m-0">
            {filteredConcerns.length > 0
              ? `Showing ${startIndex + 1}-${Math.min(endIndex, filteredConcerns.length)} of ${filteredConcerns.length} • Page ${currentPage} of ${totalPages}`
              : `Concerns and feedback related to Merchant Office • Total: ${concerns.length}`
            }
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'all' ? 'rgba(255,212,28,0.2)' : 'transparent',
              border: `2px solid ${activeTab === 'all' ? '#FFD41C' : 'rgba(255,212,28,0.3)'}`,
              borderRadius: '8px',
              color: activeTab === 'all' ? '#FFD41C' : 'rgba(251,251,251,0.6)',
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
              color: activeTab === 'assistance' ? '#3B82F6' : 'rgba(251,251,251,0.6)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🆘 Assistance ({concerns.filter(c => c.submissionType === 'assistance').length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'feedback' ? 'rgba(34,197,94,0.2)' : 'transparent',
              border: `2px solid ${activeTab === 'feedback' ? '#22C55E' : 'rgba(34,197,94,0.3)'}`,
              borderRadius: '8px',
              color: activeTab === 'feedback' ? '#22C55E' : 'rgba(251,251,251,0.6)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            💬 Feedback ({concerns.filter(c => c.submissionType === 'feedback').length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by ID, user, title, category, or status..."
          />
          <StatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
            label="Status"
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' }
            ]}
          />
          <StatusFilter
            value={priorityFilter}
            onChange={setPriorityFilter}
            label="Priority"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' }
            ]}
          />
          <StatusFilter
            value={categoryFilter}
            onChange={setCategoryFilter}
            label="Category"
            options={[
              { value: 'payment_issue', label: 'Payment Issue' },
              { value: 'driver_complaint', label: 'Driver Complaint' },
              { value: 'shuttle_issue', label: 'Shuttle Issue' },
              { value: 'technical_problem', label: 'Technical Problem' },
              { value: 'safety_concern', label: 'Safety Concern' },
              { value: 'route_suggestion', label: 'Route Suggestion' },
              { value: 'billing_dispute', label: 'Billing Dispute' },
              { value: 'lost_item', label: 'Lost Item' },
              { value: 'other', label: 'Other' }
            ]}
          />
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
          <ExportButton onClick={handleExport} disabled={filteredConcerns.length === 0} />
        </div>
      </div>

      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto pr-2">
      {concerns.length === 0 ? (
        <div className="text-center py-[60px] text-[rgba(251,251,251,0.5)]">
          <div className="text-5xl mb-4">🏪</div>
          <div>No merchant concerns found</div>
        </div>
      ) : filteredConcerns.length === 0 ? (
        <div className="text-center py-[60px] text-[rgba(251,251,251,0.5)]">
          <div className="text-5xl mb-4">🔍</div>
          <div style={{ marginBottom: '12px' }}>No concerns match your search</div>
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
                <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">ID</th>
                <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">User</th>
                <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Subject</th>
                {activeTab === 'all' && (
                  <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Type</th>
                )}
                {activeTab === 'feedback' && (
                  <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Rating</th>
                )}
                {activeTab !== 'feedback' && (
                  <>
                    <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Priority</th>
                    <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Status</th>
                  </>
                )}
                <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Date</th>
                <th style={{ textAlign: 'right', padding: '16px', fontSize: '11px', fontWeight: 800, color: '#FFD41C', textTransform: 'uppercase', borderBottom: '2px solid rgba(255,212,28,0.3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((concern) => (
                <tr key={concern._id} style={{ borderBottom: '1px solid rgba(255,212,28,0.1)' }}>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    <strong>{concern.concernId || concern._id.slice(-6)}</strong>
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    {concern.userName || 'N/A'}
                  </td>
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    {concern.subject ||
                     (concern.selectedConcerns && concern.selectedConcerns.length > 0
                       ? `${concern.selectedConcerns[0]}${concern.selectedConcerns.length > 1 ? ` +${concern.selectedConcerns.length - 1}` : ''}`
                       : 'N/A')}
                  </td>
                  {activeTab === 'all' && (
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: concern.submissionType === 'assistance' ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)',
                        color: concern.submissionType === 'assistance' ? '#3B82F6' : '#22C55E',
                        border: `1px solid ${concern.submissionType === 'assistance' ? 'rgba(59,130,246,0.3)' : 'rgba(34,197,94,0.3)'}`,
                      }}>
                        {concern.submissionType === 'assistance' ? '🆘 Assistance' : '💬 Feedback'}
                      </span>
                    </td>
                  )}
                  {activeTab === 'feedback' && (
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {[...Array(5)].map((_, i) => (
                          <span key={i} style={{
                            fontSize: '16px',
                            color: i < (concern.rating || 0) ? '#FFD41C' : 'rgba(255,212,28,0.2)'
                          }}>
                            ⭐
                          </span>
                        ))}
                        <span style={{ marginLeft: '8px', color: 'rgba(251,251,251,0.7)', fontSize: '12px' }}>
                          ({concern.rating || 0}/5)
                        </span>
                      </div>
                    </td>
                  )}
                  {activeTab !== 'feedback' && (
                    <>
                      <td style={{ padding: '16px' }}>
                        {concern.submissionType === 'assistance' ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: concern.priority === 'urgent' ? 'rgba(239,68,68,0.2)' :
                                        concern.priority === 'high' ? 'rgba(251,146,60,0.2)' :
                                        concern.priority === 'medium' ? 'rgba(251,191,36,0.2)' : 'rgba(34,197,94,0.2)',
                            color: concern.priority === 'urgent' ? '#EF4444' :
                                   concern.priority === 'high' ? '#FB923C' :
                                   concern.priority === 'medium' ? '#FBBF24' : '#22C55E',
                          }}>
                            {concern.priority || 'low'}
                          </span>
                        ) : (
                          <span style={{ color: 'rgba(251,251,251,0.4)', fontSize: '11px' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {concern.submissionType === 'assistance' ? (
                          <select
                            value={concern.status || 'pending'}
                            onChange={(e) => handleStatusChange(concern, e.target.value)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid rgba(255,212,28,0.3)',
                              background: 'rgba(255,255,255,0.05)',
                              color: concern.status === 'resolved' ? '#22C55E' :
                                     concern.status === 'in_progress' ? '#3B82F6' :
                                     concern.status === 'closed' ? '#6B7280' : '#FBBF24',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        ) : (
                          <span style={{ color: 'rgba(251,251,251,0.4)', fontSize: '11px' }}>—</span>
                        )}
                      </td>
                    </>
                  )}
                  <td style={{ padding: '16px', color: 'rgba(251,251,251,0.9)' }}>
                    {new Date(concern.submittedAt || concern.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleViewDetails(concern.concernId)}
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

      {/* Concern Detail Modal */}
      {showDetailsModal && selectedConcern && (
        <ConcernDetailModal
          concern={selectedConcern}
          onClose={() => setShowDetailsModal(false)}
          onResolve={() => handleOpenResolve(selectedConcern)}
        />
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
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1227 100%)',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '85vh',
              overflow: 'auto',
              border: '2px solid rgba(255,212,28,0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              animation: 'slideIn 0.3s ease'
            }}
          >
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
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FFD41C', margin: 0, marginBottom: '8px' }}>
                  Resolve Concern
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(251,251,251,0.6)', margin: 0 }}>
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
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Warning Box */}
              <div style={{
                background: 'rgba(251,191,36,0.1)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderLeft: '4px solid #FBBF24',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#FBBF24' }}>
                    Confirm Resolution
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(251,251,251,0.7)', margin: 0, lineHeight: '1.5' }}>
                  This will mark the concern as resolved and send an email notification to the user.
                </p>
              </div>

              {/* Concern Information */}
              <div style={{
                background: 'rgba(255,212,28,0.05)',
                border: '1px solid rgba(255,212,28,0.2)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#FFD41C',
                  textTransform: 'uppercase',
                  marginBottom: '12px'
                }}>
                  Concern Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>
                      Concern ID
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontFamily: 'monospace', fontWeight: 600 }}>
                      {selectedConcern.concernId}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>User</div>
                    <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)', fontWeight: 600 }}>
                      {selectedConcern.userName}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginBottom: '4px' }}>
                      Subject
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(251,251,251,0.9)' }}>
                      {selectedConcern.subject}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resolution Details */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#FFD41C',
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}>
                  Resolution Details (Optional)
                </h3>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how this concern was resolved (optional)..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid rgba(255,212,28,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#FBFBFB',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ fontSize: '11px', color: 'rgba(251,251,251,0.5)', marginTop: '8px', margin: '8px 0 0 0' }}>
                  This message will be included in the email notification to the user.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px 24px',
              borderTop: '2px solid rgba(255,212,28,0.2)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowResolveModal(false)}
                disabled={resolving}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#FBFBFB',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: resolving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 700,
                  opacity: resolving ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={resolving}
                style={{
                  padding: '12px 24px',
                  background: resolving ? 'rgba(34,197,94,0.3)' : '#22C55E',
                  color: resolving ? '#22C55E' : '#0f1227',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: resolving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 700,
                  opacity: resolving ? 0.5 : 1,
                  boxShadow: resolving ? 'none' : '0 4px 12px rgba(34,197,94,0.4)'
                }}
              >
                {resolving ? 'Resolving...' : '✓ Mark as Resolved'}
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
          `}</style>
        </div>
      )}
    </div>
  );
}
