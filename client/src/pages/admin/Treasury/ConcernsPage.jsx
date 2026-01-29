// src/pages/admin/Treasury/ConcernsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import { Search } from 'lucide-react';

export default function ConcernsPage() {
  const { theme, isDarkMode } = useTheme();
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewedConcerns, setViewedConcerns] = useState(() => {
    // Load viewed concerns from localStorage
    const saved = localStorage.getItem('viewedConcerns_treasury');
    return saved ? JSON.parse(saved) : [];
  });
  const intervalRef = useRef(null);

  const fetchConcerns = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const data = await api.get(`/admin/treasury/concerns?${params}`);
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

    intervalRef.current = setInterval(() => fetchConcerns(true), 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [statusFilter, searchTerm]);

  // Mark concern as viewed
  const markAsViewed = (concernId) => {
    if (!viewedConcerns.includes(concernId)) {
      const updated = [...viewedConcerns, concernId];
      setViewedConcerns(updated);
      localStorage.setItem('viewedConcerns_treasury', JSON.stringify(updated));
    }
  };

  // Check if concern is unread/unseen
  const isUnread = (concern) => {
    return !viewedConcerns.includes(concern._id) && concern.status === 'pending';
  };

  const handleViewConcern = (concern) => {
    setSelectedConcern(concern);
    markAsViewed(concern._id);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedConcern) return;

    setSubmitting(true);
    try {
      const data = await api.post(`/admin/treasury/concerns/${selectedConcern._id}/reply`, {
        reply: replyText.trim()
      });

      if (data?.success) {
        toast.success('Reply sent');
        setReplyText('');
        setSelectedConcern(null);
        fetchConcerns(true);
      } else {
        toast.error(data?.message || 'Failed to send reply');
      }
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (concernId, newStatus) => {
    try {
      const data = await api.patch(`/admin/treasury/concerns/${concernId}/status`, {
        status: newStatus
      });

      if (data?.success) {
        toast.success('Status updated');
        fetchConcerns(true);
        if (selectedConcern?._id === concernId) {
          setSelectedConcern(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FBBF24';
      case 'in_progress': return '#3B82F6';
      case 'resolved': return '#10B981';
      default: return theme.text.secondary;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-6 border-b-2 pb-5">
        <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>💬</span> Concerns
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Manage user support tickets and concerns
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          background: isDarkMode ? 'rgba(15,18,39,0.8)' : theme.bg.card,
          borderColor: theme.accent.primary
        }}
        className="rounded-xl border-2 p-3 mb-5 flex items-center gap-4"
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
        <div style={{ background: theme.border.primary }} className="w-px h-8" />

        {/* Status Filter */}
        <div className="flex gap-2">
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
          Showing <span style={{ color: theme.accent.primary }} className="font-bold">{concerns.length}</span> concerns
          {concerns.filter(c => isUnread(c)).length > 0 && (
            <span className="ml-2 text-yellow-500">
              ({concerns.filter(c => isUnread(c)).length} unread)
            </span>
          )}
        </p>
      </div>

      {/* Concerns List */}
      <div className="flex-1 overflow-y-auto">
        <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border overflow-hidden">
          {loading ? (
            <div style={{ color: theme.accent.primary }} className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: `${theme.accent.primary} transparent transparent transparent` }} />
              Loading concerns...
            </div>
          ) : concerns.length === 0 ? (
            <div style={{ color: theme.text.tertiary }} className="text-center py-20">
              <div className="text-5xl mb-4">💬</div>
              <p>No concerns found</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: theme.border.primary }}>
              {concerns.map((concern) => {
                const unread = isUnread(concern);
                return (
                  <div
                    key={concern._id}
                    className={`p-4 flex items-center justify-between cursor-pointer transition relative ${unread ? 'concern-glow' : 'hover:bg-white/5'}`}
                    onClick={() => handleViewConcern(concern)}
                    style={{
                      background: unread ? 'rgba(251, 191, 36, 0.08)' : 'transparent'
                    }}
                  >
                    {/* Unread indicator */}
                    {unread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-r" />
                    )}

                    <div className="flex-1 pl-2">
                      <div className="flex items-center gap-3 mb-2">
                        <span style={{ background: `${getStatusColor(concern.status)}20`, color: getStatusColor(concern.status) }} className="px-2 py-1 rounded text-xs font-semibold capitalize">
                          {concern.status?.replace('_', ' ')}
                        </span>
                        <span style={{ color: theme.text.primary }} className="font-semibold">
                          {concern.subject}
                        </span>
                        {unread && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-[10px] font-bold rounded-full animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                      <p style={{ color: theme.text.secondary }} className="text-sm line-clamp-1">
                        {concern.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span style={{ color: theme.text.muted }} className="text-xs">
                          From: {concern.user?.firstName} {concern.user?.lastName}
                        </span>
                        <span style={{ color: theme.text.muted }} className="text-xs">
                          {concern.createdAt ? new Date(concern.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                    <span style={{ color: theme.text.secondary }} className="text-xl">→</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Concern Detail Modal */}
      {selectedConcern && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedConcern(null)}
        >
          <div
            style={{ background: theme.bg.secondary, borderColor: theme.border.primary }}
            className="w-full max-w-2xl max-h-[85vh] overflow-auto rounded-2xl border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ background: theme.bg.tertiary, borderColor: theme.border.primary }} className="p-6 border-b sticky top-0">
              <div className="flex justify-between items-start">
                <div>
                  <span style={{ background: `${getStatusColor(selectedConcern.status)}20`, color: getStatusColor(selectedConcern.status) }} className="px-2 py-1 rounded text-xs font-semibold capitalize mb-2 inline-block">
                    {selectedConcern.status?.replace('_', ' ')}
                  </span>
                  <h3 style={{ color: theme.text.primary }} className="text-xl font-bold">
                    {selectedConcern.subject}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedConcern(null)}
                  style={{ color: theme.text.secondary }}
                  className="text-2xl hover:opacity-70"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div style={{ background: theme.accent.primary, color: theme.accent.secondary }} className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                  {selectedConcern.user?.firstName?.charAt(0) || '?'}
                </div>
                <div>
                  <p style={{ color: theme.text.primary }} className="font-semibold">
                    {selectedConcern.user?.firstName} {selectedConcern.user?.lastName}
                  </p>
                  <p style={{ color: theme.text.secondary }} className="text-sm">
                    {selectedConcern.user?.email}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p style={{ color: theme.text.muted }} className="text-xs">
                    {selectedConcern.createdAt ? new Date(selectedConcern.createdAt).toLocaleString() : ''}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div style={{ background: theme.bg.tertiary, borderColor: theme.border.primary }} className="p-4 rounded-xl border">
                <p style={{ color: theme.text.primary }} className="whitespace-pre-wrap">
                  {selectedConcern.message}
                </p>
              </div>

              {/* Status Update */}
              <div>
                <p style={{ color: theme.text.secondary }} className="text-sm font-semibold mb-2">Update Status</p>
                <div className="flex gap-2">
                  {['pending', 'in_progress', 'resolved'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedConcern._id, status)}
                      style={{
                        background: selectedConcern.status === status ? getStatusColor(status) : `${getStatusColor(status)}20`,
                        color: selectedConcern.status === status ? '#FFFFFF' : getStatusColor(status),
                        borderColor: getStatusColor(status)
                      }}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold border capitalize transition"
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply Input */}
              <div>
                <p style={{ color: theme.text.secondary }} className="text-sm font-semibold mb-2">Send Reply</p>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  style={{ background: theme.bg.tertiary, color: theme.text.primary, borderColor: theme.border.primary }}
                  className="w-full p-3 rounded-xl border focus:outline-none resize-none"
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleReply}
                    disabled={submitting || !replyText.trim()}
                    style={{
                      background: submitting || !replyText.trim() ? 'rgba(100,100,100,0.3)' : theme.accent.primary,
                      color: submitting || !replyText.trim() ? theme.text.muted : theme.accent.secondary
                    }}
                    className="px-6 py-2 rounded-lg font-bold transition"
                  >
                    {submitting ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for glow effect */}
      <style>{`
        .concern-glow {
          animation: glowPulse 2s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0%, 100% {
            box-shadow: inset 0 0 20px rgba(251, 191, 36, 0.1);
          }
          50% {
            box-shadow: inset 0 0 30px rgba(251, 191, 36, 0.2);
          }
        }
      `}</style>
    </div>
  );
}
