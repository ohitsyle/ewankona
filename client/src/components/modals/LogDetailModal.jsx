// src/admin/components/Logs/LogDetailModal.jsx
// Updated to remove location and severity, uses theme context
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { X } from 'lucide-react';

export default function LogDetailModal({ log, onClose }) {
  const { theme, isDarkMode } = useTheme();

  if (!log) return null;

  const getTypeColor = (type) => {
    switch (type) {
      case 'login': return { bg: 'rgba(34,197,94,0.2)', color: '#22C55E', border: 'rgba(34,197,94,0.3)' };
      case 'logout': return { bg: 'rgba(239,68,68,0.2)', color: '#EF4444', border: 'rgba(239,68,68,0.3)' };
      case 'cash_in': return { bg: 'rgba(16,185,129,0.2)', color: '#10B981', border: 'rgba(16,185,129,0.3)' };
      case 'registration': return { bg: 'rgba(59,130,246,0.2)', color: '#3B82F6', border: 'rgba(59,130,246,0.3)' };
      case 'admin_action': return { bg: 'rgba(59,130,246,0.2)', color: '#3B82F6', border: 'rgba(59,130,246,0.3)' };
      case 'user_action': return { bg: 'rgba(168,85,247,0.2)', color: '#A855F7', border: 'rgba(168,85,247,0.3)' };
      default: return { bg: 'rgba(255,212,28,0.2)', color: '#FFD41C', border: 'rgba(255,212,28,0.3)' };
    }
  };

  const getStatusColor = (status) => {
    if (status === 'success' || !status) {
      return { bg: 'rgba(34,197,94,0.2)', color: '#22C55E', border: 'rgba(34,197,94,0.3)' };
    }
    if (status === 'failed' || status === 'error') {
      return { bg: 'rgba(239,68,68,0.2)', color: '#EF4444', border: 'rgba(239,68,68,0.3)' };
    }
    return { bg: 'rgba(251,191,36,0.2)', color: '#FBBF24', border: 'rgba(251,191,36,0.3)' };
  };

  const typeStyle = getTypeColor(log.eventType || log.type);
  const statusStyle = getStatusColor(log.status);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
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
            background: `linear-gradient(135deg, ${theme.accent.primary} 0%, ${isDarkMode ? '#B8860B' : '#2563EB'} 100%)`
          }}
          className="px-6 py-5 flex items-center justify-between"
        >
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              📋 Log Details
            </h3>
            <p className="text-white/70 text-sm mt-1 font-mono">
              {log.eventId || log._id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">
          {/* Timestamp & Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              style={{
                background: typeStyle.bg,
                color: typeStyle.color,
                border: `1px solid ${typeStyle.border}`
              }}
              className="px-3 py-1.5 rounded-full text-xs font-bold uppercase"
            >
              {log.eventType || log.type || 'action'}
            </span>
            <span
              style={{
                background: statusStyle.bg,
                color: statusStyle.color,
                border: `1px solid ${statusStyle.border}`
              }}
              className="px-3 py-1.5 rounded-full text-xs font-bold uppercase"
            >
              {log.status || 'success'}
            </span>
            <span style={{ color: theme.text.secondary }} className="text-sm">
              🕒 {new Date(log.timestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>

          {/* Action/Title */}
          {log.title && (
            <div>
              <div style={{ color: theme.accent.primary }} className="text-xs font-bold uppercase tracking-wide mb-2">
                Action
              </div>
              <div style={{ color: theme.text.primary }} className="text-lg font-semibold">
                {log.title}
              </div>
            </div>
          )}

          {/* Description/Message */}
          {(log.description || log.message) && (
            <div>
              <div style={{ color: theme.accent.primary }} className="text-xs font-bold uppercase tracking-wide mb-2">
                Description
              </div>
              <div
                style={{
                  background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                  borderColor: theme.border.primary
                }}
                className="p-4 rounded-xl border"
              >
                <p style={{ color: theme.text.primary }} className="whitespace-pre-wrap leading-relaxed">
                  {log.description || log.message}
                </p>
              </div>
            </div>
          )}

          {/* User/Entity Information */}
          <div>
            <div style={{ color: theme.accent.primary }} className="text-xs font-bold uppercase tracking-wide mb-2">
              Entity Information
            </div>
            <div
              style={{
                background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                borderColor: theme.border.primary
              }}
              className="rounded-xl border p-4 space-y-3"
            >
              {(log.adminName || log.driverName) && (
                <div className="flex justify-between">
                  <span style={{ color: theme.text.secondary }} className="text-sm">User</span>
                  <span style={{ color: theme.text.primary }} className="text-sm font-semibold">
                    {log.adminName || log.driverName || 'System'}
                  </span>
                </div>
              )}
              {(log.adminId || log.driverId || log.userId) && (
                <div className="flex justify-between">
                  <span style={{ color: theme.text.secondary }} className="text-sm">ID Number</span>
                  <span style={{ color: theme.text.primary }} className="text-sm font-mono font-semibold">
                    {log.adminId || log.driverId || log.userId}
                  </span>
                </div>
              )}
              {log.targetEntity && (
                <div className="flex justify-between">
                  <span style={{ color: theme.text.secondary }} className="text-sm">Target Entity</span>
                  <span style={{ color: theme.text.primary }} className="text-sm font-semibold capitalize">
                    {log.targetEntity}
                  </span>
                </div>
              )}
              {log.targetId && (
                <div className="flex justify-between">
                  <span style={{ color: theme.text.secondary }} className="text-sm">Target ID</span>
                  <span style={{ color: theme.text.primary }} className="text-sm font-mono font-semibold">
                    {log.targetId}
                  </span>
                </div>
              )}
              {log.metadata?.department && (
                <div className="flex justify-between">
                  <span style={{ color: theme.text.secondary }} className="text-sm">Department</span>
                  <span style={{ color: theme.text.primary }} className="text-sm font-semibold capitalize">
                    {log.metadata.department}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata (if any) */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <div style={{ color: theme.accent.primary }} className="text-xs font-bold uppercase tracking-wide mb-2">
                Additional Details
              </div>
              <div
                style={{
                  background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                  borderColor: theme.border.primary
                }}
                className="p-4 rounded-xl border font-mono text-xs overflow-x-auto"
              >
                <pre style={{ color: theme.text.secondary }}>
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{ borderColor: theme.border.primary }}
          className="px-6 py-4 border-t flex justify-end"
        >
          <button
            onClick={onClose}
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
