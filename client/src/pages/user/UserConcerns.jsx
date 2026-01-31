// src/pages/user/UserConcerns.jsx
// User's submitted concerns tracking page
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Search, X, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function UserConcerns() {
  const { theme, isDarkMode } = useTheme();
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConcern, setSelectedConcern] = useState(null);
  const intervalRef = useRef(null);

  const fetchConcerns = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const data = await api.get('/user/concerns/my-concerns');
      if (data?.concerns) {
        setConcerns(data.concerns);
      }
    } catch (error) {
      if (!silent) toast.error('Failed to load concerns');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcerns();

    // Auto-refresh every 60 seconds
    intervalRef.current = setInterval(() => fetchConcerns(true), 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Filter concerns
  const filteredConcerns = concerns.filter(concern => {
    const matchesStatus = statusFilter === 'all' || concern.status === statusFilter;
    const matchesSearch = !searchTerm ||
      (concern.subject?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (concern.concernId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (concern.feedbackText?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Stats
  const pendingCount = concerns.filter(c => c.status === 'pending').length;
  const inProgressCount = concerns.filter(c => c.status === 'in_progress').length;
  const resolvedCount = concerns.filter(c => c.status === 'resolved').length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FBBF24';
      case 'in_progress': return '#3B82F6';
      case 'resolved': return '#10B981';
      default: return theme.text.secondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ color: theme.accent.primary }} className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: `${theme.accent.primary} transparent transparent transparent` }} />
        Loading your concerns...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-220px)] flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-6 border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>📋</span> My Concerns
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Track the status of your submitted concerns and feedback
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div
          style={{ background: theme.bg.card, borderColor: 'rgba(251, 191, 36, 0.3)' }}
          className="p-4 rounded-xl border flex items-center gap-4"
        >
          <div style={{ background: 'rgba(251, 191, 36, 0.2)' }} className="w-12 h-12 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase">Pending</p>
            <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
          </div>
        </div>

        <div
          style={{ background: theme.bg.card, borderColor: 'rgba(59, 130, 246, 0.3)' }}
          className="p-4 rounded-xl border flex items-center gap-4"
        >
          <div style={{ background: 'rgba(59, 130, 246, 0.2)' }} className="w-12 h-12 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase">In Progress</p>
            <p className="text-2xl font-bold text-blue-500">{inProgressCount}</p>
          </div>
        </div>

        <div
          style={{ background: theme.bg.card, borderColor: 'rgba(16, 185, 129, 0.3)' }}
          className="p-4 rounded-xl border flex items-center gap-4"
        >
          <div style={{ background: 'rgba(16, 185, 129, 0.2)' }} className="w-12 h-12 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase">Resolved</p>
            <p className="text-2xl font-bold text-emerald-500">{resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          background: isDarkMode ? 'rgba(15,18,39,0.8)' : theme.bg.card,
          borderColor: theme.accent.primary
        }}
        className="rounded-xl border-2 p-3 mb-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
      >
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search
            style={{ color: theme.text.tertiary }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
          />
          <input
            type="text"
            placeholder="Search concerns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              color: theme.text.primary,
              borderColor: 'transparent'
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none placeholder:text-gray-500"
          />
        </div>

        {/* Divider */}
        <div style={{ background: theme.border.primary }} className="hidden sm:block w-px h-8" />

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'in_progress', 'resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                background: statusFilter === status ? theme.accent.primary : (isDarkMode ? 'rgba(30,35,71,0.8)' : '#F9FAFB'),
                color: statusFilter === status ? (isDarkMode ? '#181D40' : '#FFFFFF') : theme.text.primary,
                borderColor: theme.border.primary
              }}
              className="px-3 py-2 rounded-lg font-semibold text-xs border hover:opacity-80 transition"
            >
              {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p style={{ color: theme.text.secondary }} className="text-sm">
          Showing <span style={{ color: theme.accent.primary }} className="font-bold">{filteredConcerns.length}</span> of {concerns.length} concerns
        </p>
      </div>

      {/* Concerns List */}
      <div className="flex-1">
        <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border overflow-hidden">
          {filteredConcerns.length === 0 ? (
            <div style={{ color: theme.text.tertiary }} className="text-center py-20">
              <div className="text-5xl mb-4">📋</div>
              <p className="font-semibold">No concerns found</p>
              <p className="text-sm mt-2">
                {concerns.length === 0
                  ? "You haven't submitted any concerns yet"
                  : "Try adjusting your filters"
                }
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: theme.border.primary }}>
              {filteredConcerns.map((concern) => (
                <div
                  key={concern._id}
                  className="p-4 flex items-center justify-between cursor-pointer transition hover:bg-white/5"
                  onClick={() => setSelectedConcern(concern)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span
                        style={{
                          background: `${getStatusColor(concern.status)}20`,
                          color: getStatusColor(concern.status)
                        }}
                        className="px-2 py-1 rounded text-xs font-semibold capitalize flex items-center gap-1"
                      >
                        {getStatusIcon(concern.status)}
                        {concern.status?.replace('_', ' ')}
                      </span>
                      <span style={{ color: theme.text.primary }} className="font-semibold">
                        {concern.subject || concern.selectedConcerns?.join(', ') || 'No subject'}
                      </span>
                    </div>
                    <p style={{ color: theme.text.secondary }} className="text-sm line-clamp-1">
                      {concern.feedbackText || concern.otherConcern || 'No details'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span style={{ color: theme.text.muted }} className="text-xs">
                        To: {concern.reportTo}
                      </span>
                      <span style={{ color: theme.text.muted }} className="text-xs">
                        {formatDate(concern.submittedAt || concern.createdAt)}
                      </span>
                      {concern.concernId && (
                        <span style={{ color: theme.text.muted }} className="text-xs font-mono">
                          #{concern.concernId}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ color: theme.text.secondary }} className="text-xl ml-4">→</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Concern Detail Modal */}
      {selectedConcern && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => setSelectedConcern(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal Content */}
          <div
            style={{
              background: isDarkMode ? '#1E2347' : '#FFFFFF',
              borderColor: theme.border.primary
            }}
            className="relative rounded-2xl shadow-2xl border w-full max-w-2xl max-h-[85vh] overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: isDarkMode
                  ? `linear-gradient(135deg, ${getStatusColor(selectedConcern.status)}30 0%, ${getStatusColor(selectedConcern.status)}10 100%)`
                  : `linear-gradient(135deg, ${getStatusColor(selectedConcern.status)}20 0%, ${getStatusColor(selectedConcern.status)}10 100%)`,
                borderColor: `${getStatusColor(selectedConcern.status)}50`
              }}
              className="px-6 py-4 flex items-center justify-between border-b"
            >
              <div className="flex items-center gap-3">
                <div
                  style={{ background: `${getStatusColor(selectedConcern.status)}30` }}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                >
                  {getStatusIcon(selectedConcern.status)}
                </div>
                <div>
                  <h2 style={{ color: getStatusColor(selectedConcern.status) }} className="text-xl font-bold">
                    Concern Details
                  </h2>
                  <p style={{ color: theme.text.secondary }} className="text-sm">
                    {selectedConcern.concernId || 'No ID'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConcern(null)}
                style={{ color: theme.text.secondary }}
                className="hover:opacity-70 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span
                  style={{
                    background: `${getStatusColor(selectedConcern.status)}20`,
                    color: getStatusColor(selectedConcern.status)
                  }}
                  className="px-3 py-1.5 rounded-full text-sm font-bold capitalize flex items-center gap-2"
                >
                  {getStatusIcon(selectedConcern.status)}
                  {selectedConcern.status?.replace('_', ' ')}
                </span>
                <span style={{ color: theme.text.muted }} className="text-sm">
                  Submitted {formatDate(selectedConcern.submittedAt || selectedConcern.createdAt)}
                </span>
              </div>

              {/* Info Grid */}
              <div
                style={{
                  background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                  borderColor: theme.border.primary
                }}
                className="rounded-xl border p-4 space-y-3"
              >
                <div className="flex justify-between">
                  <span style={{ color: theme.text.secondary }} className="text-sm">Subject</span>
                  <span style={{ color: theme.text.primary }} className="text-sm font-semibold text-right max-w-[60%]">
                    {selectedConcern.subject || selectedConcern.selectedConcerns?.join(', ') || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: theme.text.secondary }} className="text-sm">Submitted To</span>
                  <span style={{ color: theme.text.primary }} className="text-sm font-semibold">
                    {selectedConcern.reportTo || 'N/A'}
                  </span>
                </div>
                {selectedConcern.plateNumber && (
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }} className="text-sm">Plate Number</span>
                    <span style={{ color: theme.text.primary }} className="text-sm font-mono font-semibold">
                      {selectedConcern.plateNumber}
                    </span>
                  </div>
                )}
                {selectedConcern.resolvedDate && (
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }} className="text-sm">Resolved Date</span>
                    <span style={{ color: '#10B981' }} className="text-sm font-semibold">
                      {formatDate(selectedConcern.resolvedDate)}
                    </span>
                  </div>
                )}
              </div>

              {/* Your Message */}
              <div>
                <p style={{ color: theme.text.secondary }} className="text-sm font-semibold mb-2">Your Message</p>
                <div
                  style={{
                    background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                    borderColor: theme.border.primary
                  }}
                  className="rounded-xl border p-4"
                >
                  <p style={{ color: theme.text.primary }} className="whitespace-pre-wrap">
                    {selectedConcern.feedbackText || selectedConcern.otherConcern || 'No message provided'}
                  </p>
                </div>
              </div>

              {/* Admin Response */}
              {selectedConcern.adminResponse && (
                <div>
                  <p style={{ color: theme.text.secondary }} className="text-sm font-semibold mb-2">
                    Response from {selectedConcern.reportTo || 'Admin'}
                  </p>
                  <div
                    style={{
                      background: 'rgba(16,185,129,0.1)',
                      borderColor: 'rgba(16,185,129,0.3)'
                    }}
                    className="rounded-xl border p-4"
                  >
                    <p style={{ color: theme.text.primary }} className="whitespace-pre-wrap">
                      {selectedConcern.adminResponse}
                    </p>
                    {selectedConcern.respondedDate && (
                      <p style={{ color: theme.text.muted }} className="text-xs mt-3">
                        Responded on {formatDate(selectedConcern.respondedDate)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Status Message */}
              {selectedConcern.status === 'pending' && (
                <div
                  style={{
                    background: 'rgba(251,191,36,0.1)',
                    borderColor: 'rgba(251,191,36,0.3)'
                  }}
                  className="rounded-xl border p-4 flex items-start gap-3"
                >
                  <Clock className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p style={{ color: '#FBBF24' }} className="font-semibold">Awaiting Review</p>
                    <p style={{ color: theme.text.secondary }} className="text-sm mt-1">
                      Your concern has been received and is waiting to be reviewed by the {selectedConcern.reportTo || 'support team'}.
                    </p>
                  </div>
                </div>
              )}

              {selectedConcern.status === 'in_progress' && (
                <div
                  style={{
                    background: 'rgba(59,130,246,0.1)',
                    borderColor: 'rgba(59,130,246,0.3)'
                  }}
                  className="rounded-xl border p-4 flex items-start gap-3"
                >
                  <Loader2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0 animate-spin" />
                  <div>
                    <p style={{ color: '#3B82F6' }} className="font-semibold">Being Reviewed</p>
                    <p style={{ color: theme.text.secondary }} className="text-sm mt-1">
                      Our team is currently looking into your concern. We'll get back to you with a resolution soon.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedConcern(null)}
                style={{
                  background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB',
                  color: theme.text.primary
                }}
                className="px-6 py-2.5 rounded-xl font-semibold transition-all hover:opacity-80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
