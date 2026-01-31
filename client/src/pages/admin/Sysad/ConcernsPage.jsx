// src/pages/admin/Sysad/ConcernsPage.jsx
// System Admin Concerns - Only shows concerns for System Admin department

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import { Search, X, CheckCircle, Clock, Loader2, Send, Download, MessageSquare, Star, AlertCircle } from 'lucide-react';
import { exportToCSV } from '../../../utils/csvExport';

export default function SysadConcernsPage() {
  const { theme, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('concerns');
  const [concerns, setConcerns] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedItem, setSelectedItem] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const intervalRef = useRef(null);

  // Purple accent for sysad
  const accentColor = '#8B5CF6';

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      params.append('sortBy', sortBy);

      // Fetch concerns and feedbacks for sysad department only
      const [concernsData, feedbacksData] = await Promise.all([
        api.get(`/admin/sysad/concerns?${params}`),
        api.get(`/admin/sysad/feedbacks?${params}`)
      ]);

      if (concernsData?.concerns) setConcerns(concernsData.concerns);
      if (feedbacksData?.feedbacks) setFeedbacks(feedbacksData.feedbacks);
    } catch (error) {
      if (!silent) toast.error('Failed to load data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => fetchData(true), 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [statusFilter, searchTerm, sortBy]);

  const handleResolve = async () => {
    if (!replyText.trim() || !selectedItem) {
      toast.error('Please enter a response before resolving');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/admin/sysad/concerns/${selectedItem._id}/resolve`, {
        resolution: replyText.trim()
      });
      toast.success('Concern resolved and user notified');
      setReplyText('');
      setSelectedItem(null);
      fetchData(true);
    } catch (error) {
      toast.error('Failed to resolve concern');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportConcerns = () => {
    const exportData = concerns.map(c => ({
      'Concern ID': c.concernId,
      'User': `${c.userName || 'N/A'} (${c.userEmail || 'N/A'})`,
      'Timestamp': new Date(c.submittedAt || c.createdAt).toLocaleString(),
      'Type': c.selectedConcerns?.join(', ') || c.subject || 'N/A',
      'Status': c.status,
      'Details': c.feedbackText || c.otherConcern || 'N/A'
    }));
    exportToCSV(exportData, `sysad-concerns-${sortBy}`);
    toast.success('Concerns exported');
  };

  const handleExportFeedbacks = () => {
    const exportData = feedbacks.map(f => ({
      'User': `${f.userName || 'N/A'} (${f.userEmail || 'N/A'})`,
      'Timestamp': new Date(f.submittedAt || f.createdAt).toLocaleString(),
      'Rating': f.rating ? `${f.rating}/5` : 'N/A',
      'Type': f.subject || 'General',
      'Feedback': f.feedbackText || 'N/A'
    }));
    exportToCSV(exportData, `sysad-feedbacks-${sortBy}`);
    toast.success('Feedbacks exported');
  };

  // Stats
  const pendingConcerns = concerns.filter(c => c.status === 'pending').length;
  const resolvedConcerns = concerns.filter(c => c.status === 'resolved').length;
  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.filter(f => f.rating).length).toFixed(1)
    : 'N/A';

  const tabs = [
    { id: 'concerns', label: 'Concerns', icon: AlertCircle, count: concerns.length },
    { id: 'feedbacks', label: 'Feedbacks', icon: MessageSquare, count: feedbacks.length }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FBBF24';
      case 'in_progress': return '#3B82F6';
      case 'resolved': return '#10B981';
      default: return theme.text.secondary;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ color: accentColor }} className="text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-220px)] flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-6 border-b-2 pb-5">
        <h2 style={{ color: accentColor }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>💬</span> User Concerns & Feedback
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Manage concerns and feedback submitted to System Admin
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
        <div style={{ background: theme.bg.card, borderColor: 'rgba(251,191,36,0.3)' }} className="p-4 rounded-xl border flex items-center gap-3">
          <div style={{ background: 'rgba(251,191,36,0.2)' }} className="w-10 h-10 rounded-full flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase">Pending</p>
            <p className="text-xl font-bold text-amber-500">{pendingConcerns}</p>
          </div>
        </div>

        <div style={{ background: theme.bg.card, borderColor: 'rgba(16,185,129,0.3)' }} className="p-4 rounded-xl border flex items-center gap-3">
          <div style={{ background: 'rgba(16,185,129,0.2)' }} className="w-10 h-10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase">Resolved</p>
            <p className="text-xl font-bold text-emerald-500">{resolvedConcerns}</p>
          </div>
        </div>

        <div style={{ background: theme.bg.card, borderColor: 'rgba(139,92,246,0.3)' }} className="p-4 rounded-xl border flex items-center gap-3">
          <div style={{ background: 'rgba(139,92,246,0.2)' }} className="w-10 h-10 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase">Total Feedback</p>
            <p className="text-xl font-bold text-violet-500">{feedbacks.length}</p>
          </div>
        </div>

        <div style={{ background: theme.bg.card, borderColor: 'rgba(245,158,11,0.3)' }} className="p-4 rounded-xl border flex items-center gap-3">
          <div style={{ background: 'rgba(245,158,11,0.2)' }} className="w-10 h-10 rounded-full flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase">Avg Rating</p>
            <p className="text-xl font-bold text-amber-500">{avgRating}/5</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? accentColor : (isDarkMode ? 'rgba(30,35,71,0.8)' : '#F9FAFB'),
                color: activeTab === tab.id ? '#FFFFFF' : theme.text.secondary,
                borderColor: theme.border.primary
              }}
              className="px-4 py-2.5 rounded-lg font-semibold text-sm border flex items-center gap-2 transition hover:opacity-80"
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span
                style={{
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : `${accentColor}20`,
                  color: activeTab === tab.id ? '#FFFFFF' : accentColor
                }}
                className="px-2 py-0.5 rounded-full text-xs font-bold"
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div
        style={{
          background: isDarkMode ? 'rgba(15,18,39,0.8)' : theme.bg.card,
          borderColor: accentColor
        }}
        className="rounded-xl border-2 p-3 mb-5 flex flex-wrap gap-3 items-center justify-between"
      >
        <div className="flex flex-wrap gap-3 items-center flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search style={{ color: theme.text.tertiary }} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', color: theme.text.primary }}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none"
            />
          </div>

          {/* Status Filter (for concerns) */}
          {activeTab === 'concerns' && (
            <div className="flex gap-2">
              {['all', 'pending', 'resolved'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    background: statusFilter === status ? accentColor : (isDarkMode ? 'rgba(30,35,71,0.8)' : '#F9FAFB'),
                    color: statusFilter === status ? '#FFFFFF' : theme.text.secondary,
                    borderColor: theme.border.primary
                  }}
                  className="px-3 py-2 rounded-lg font-semibold text-xs border capitalize transition"
                >
                  {status}
                </button>
              ))}
            </div>
          )}

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ background: isDarkMode ? 'rgba(30,35,71,0.8)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
            className="px-3 py-2 rounded-lg border text-sm focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Export Button */}
        <button
          onClick={activeTab === 'concerns' ? handleExportConcerns : handleExportFeedbacks}
          style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981', borderColor: 'rgba(16,185,129,0.3)' }}
          className="px-4 py-2 rounded-lg font-semibold text-sm border flex items-center gap-2 hover:opacity-80 transition"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'concerns' ? (
          <ConcernsTable
            concerns={concerns}
            theme={theme}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            getStatusColor={getStatusColor}
            formatDate={formatDate}
            onSelect={setSelectedItem}
          />
        ) : (
          <FeedbacksTable
            feedbacks={feedbacks}
            theme={theme}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            formatDate={formatDate}
            onSelect={setSelectedItem}
          />
        )}
      </div>

      {/* Detail/Resolve Modal */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          theme={theme}
          isDarkMode={isDarkMode}
          accentColor={accentColor}
          isConcern={activeTab === 'concerns'}
          replyText={replyText}
          setReplyText={setReplyText}
          submitting={submitting}
          onResolve={handleResolve}
          onClose={() => { setSelectedItem(null); setReplyText(''); }}
          getStatusColor={getStatusColor}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

// Concerns Table
function ConcernsTable({ concerns, theme, isDarkMode, accentColor, getStatusColor, formatDate, onSelect }) {
  if (concerns.length === 0) {
    return (
      <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border p-10 text-center">
        <AlertCircle style={{ color: theme.text.tertiary }} className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p style={{ color: theme.text.tertiary }} className="font-semibold">No concerns found</p>
      </div>
    );
  }

  return (
    <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: isDarkMode ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)' }}>
            <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-left p-4 text-xs font-bold uppercase border-b-2">Concern ID</th>
            <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-left p-4 text-xs font-bold uppercase border-b-2">User</th>
            <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-left p-4 text-xs font-bold uppercase border-b-2">Timestamp</th>
            <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-left p-4 text-xs font-bold uppercase border-b-2">Type</th>
            <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-left p-4 text-xs font-bold uppercase border-b-2">Status</th>
            <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-center p-4 text-xs font-bold uppercase border-b-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {concerns.map((concern) => (
            <tr key={concern._id} style={{ borderColor: theme.border.primary }} className="border-b hover:bg-white/5 transition">
              <td style={{ color: theme.text.primary }} className="p-4 font-mono font-semibold text-xs">{concern.concernId || 'N/A'}</td>
              <td className="p-4">
                <p style={{ color: theme.text.primary }} className="font-semibold">{concern.userName || 'N/A'}</p>
                <p style={{ color: theme.text.muted }} className="text-xs">{concern.userEmail || 'N/A'}</p>
              </td>
              <td style={{ color: theme.text.secondary }} className="p-4 text-xs">{formatDate(concern.submittedAt || concern.createdAt)}</td>
              <td style={{ color: theme.text.secondary }} className="p-4 text-xs max-w-[150px] truncate">
                {concern.selectedConcerns?.join(', ') || concern.subject || 'N/A'}
              </td>
              <td className="p-4">
                <span
                  style={{ background: `${getStatusColor(concern.status)}20`, color: getStatusColor(concern.status) }}
                  className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                >
                  {concern.status?.replace('_', ' ') || 'pending'}
                </span>
              </td>
              <td className="p-4 text-center">
                <button
                  onClick={() => onSelect(concern)}
                  style={{ background: `${accentColor}20`, color: accentColor }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Feedbacks Table
function FeedbacksTable({ feedbacks, theme, isDarkMode, accentColor, formatDate, onSelect }) {
  if (feedbacks.length === 0) {
    return (
      <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border p-10 text-center">
        <MessageSquare style={{ color: theme.text.tertiary }} className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p style={{ color: theme.text.tertiary }} className="font-semibold">No feedbacks found</p>
      </div>
    );
  }

  return (
    <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: isDarkMode ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)' }}>
            <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-left p-4 text-xs font-bold uppercase border-b-2">User</th>
            <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-left p-4 text-xs font-bold uppercase border-b-2">Timestamp</th>
            <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-left p-4 text-xs font-bold uppercase border-b-2">Rating</th>
            <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-left p-4 text-xs font-bold uppercase border-b-2">Type</th>
            <th style={{ color: accentColor, borderColor: theme.border.primary }} className="text-center p-4 text-xs font-bold uppercase border-b-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {feedbacks.map((feedback) => (
            <tr key={feedback._id} style={{ borderColor: theme.border.primary }} className="border-b hover:bg-white/5 transition">
              <td className="p-4">
                <p style={{ color: theme.text.primary }} className="font-semibold">{feedback.userName || 'N/A'}</p>
                <p style={{ color: theme.text.muted }} className="text-xs">{feedback.userEmail || 'N/A'}</p>
              </td>
              <td style={{ color: theme.text.secondary }} className="p-4 text-xs">{formatDate(feedback.submittedAt || feedback.createdAt)}</td>
              <td className="p-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4"
                      style={{
                        fill: star <= (feedback.rating || 0) ? '#F59E0B' : 'transparent',
                        color: star <= (feedback.rating || 0) ? '#F59E0B' : theme.text.muted
                      }}
                    />
                  ))}
                </div>
              </td>
              <td style={{ color: theme.text.secondary }} className="p-4 text-xs">{feedback.subject || 'General'}</td>
              <td className="p-4 text-center">
                <button
                  onClick={() => onSelect(feedback)}
                  style={{ background: `${accentColor}20`, color: accentColor }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Detail Modal
function DetailModal({ item, theme, isDarkMode, accentColor, isConcern, replyText, setReplyText, submitting, onResolve, onClose, getStatusColor, formatDate }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        style={{ background: isDarkMode ? '#1E2347' : '#FFFFFF', borderColor: theme.border.primary }}
        className="relative rounded-2xl shadow-2xl border w-full max-w-2xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #7C3AED 100%)` }} className="px-6 py-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            {isConcern ? `Concern: ${item.concernId || 'N/A'}` : 'Feedback Details'}
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[55vh] overflow-y-auto">
          {/* User Info */}
          <div style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', borderColor: theme.border.primary }} className="p-4 rounded-xl border">
            <div className="flex justify-between mb-2">
              <span style={{ color: theme.text.secondary }} className="text-sm">User</span>
              <span style={{ color: theme.text.primary }} className="font-semibold">{item.userName || 'N/A'}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span style={{ color: theme.text.secondary }} className="text-sm">Email</span>
              <span style={{ color: theme.text.primary }}>{item.userEmail || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: theme.text.secondary }} className="text-sm">Submitted</span>
              <span style={{ color: theme.text.muted }}>{formatDate(item.submittedAt || item.createdAt)}</span>
            </div>
          </div>

          {/* Status (for concerns) */}
          {isConcern && (
            <div className="flex items-center gap-3">
              <span style={{ color: theme.text.secondary }} className="text-sm">Status:</span>
              <span
                style={{ background: `${getStatusColor(item.status)}20`, color: getStatusColor(item.status) }}
                className="px-3 py-1 rounded-full text-xs font-bold capitalize"
              >
                {item.status?.replace('_', ' ') || 'pending'}
              </span>
            </div>
          )}

          {/* Rating (for feedbacks) */}
          {!isConcern && item.rating && (
            <div className="flex items-center gap-3">
              <span style={{ color: theme.text.secondary }} className="text-sm">Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-5 h-5"
                    style={{
                      fill: star <= item.rating ? '#F59E0B' : 'transparent',
                      color: star <= item.rating ? '#F59E0B' : theme.text.muted
                    }}
                  />
                ))}
                <span style={{ color: theme.text.primary }} className="ml-2 font-semibold">{item.rating}/5</span>
              </div>
            </div>
          )}

          {/* Type/Subject */}
          <div>
            <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase mb-2">
              {isConcern ? 'Type' : 'Subject'}
            </p>
            <p style={{ color: theme.text.primary }}>
              {isConcern ? (item.selectedConcerns?.join(', ') || item.subject || 'N/A') : (item.subject || 'General')}
            </p>
          </div>

          {/* Message */}
          <div>
            <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase mb-2">Message</p>
            <div
              style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', borderColor: theme.border.primary }}
              className="p-4 rounded-xl border"
            >
              <p style={{ color: theme.text.primary }} className="whitespace-pre-wrap">
                {item.feedbackText || item.otherConcern || 'No message provided'}
              </p>
            </div>
          </div>

          {/* Resolution (if resolved) */}
          {isConcern && item.status === 'resolved' && item.resolution && (
            <div>
              <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase mb-2">Resolution</p>
              <div
                style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }}
                className="p-4 rounded-xl border"
              >
                <p style={{ color: theme.text.primary }} className="whitespace-pre-wrap">{item.resolution}</p>
              </div>
            </div>
          )}

          {/* Reply/Resolve (for pending concerns) */}
          {isConcern && item.status !== 'resolved' && (
            <div>
              <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase mb-2">Your Response *</p>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Enter your response to resolve this concern..."
                rows={4}
                style={{
                  background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                  color: theme.text.primary,
                  borderColor: theme.border.primary
                }}
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderColor: theme.border.primary }} className="px-6 py-4 border-t flex gap-3 justify-end">
          <button
            onClick={onClose}
            style={{ background: isDarkMode ? 'rgba(71,85,105,0.5)' : '#E5E7EB', color: theme.text.primary }}
            className="px-6 py-2.5 rounded-xl font-semibold transition hover:opacity-80"
          >
            Close
          </button>
          {isConcern && item.status !== 'resolved' && (
            <button
              onClick={onResolve}
              disabled={submitting || !replyText.trim()}
              style={{ background: '#10B981', color: '#FFFFFF' }}
              className="px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {submitting ? 'Resolving...' : 'Resolve & Notify'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
