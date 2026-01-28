// client/src/pages/admin/Shared/ConcernsManagement.jsx
// Shared Concerns Management page for Treasury and Accounting modules
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { getConcerns, updateConcernStatus } from "../../../services/concernsApi";
import { toast } from "react-toastify";

import Header from "../../../components/layouts/Header";
import Footer from "../../../components/layouts/Footer";
import Navbar from "../../../components/layouts/Navbar";

export default function ConcernsManagement() {
  const { theme, isDarkMode } = useTheme();
  const location = useLocation();

  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  useEffect(() => {
    fetchConcerns();
  }, []);

  const fetchConcerns = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        ...(filterStatus && { status: filterStatus }),
        ...(filterPriority && { priority: filterPriority })
      };

      const response = await getConcerns(params);
      setConcerns(response.concerns || response.data || []);
    } catch (error) {
      console.error("Failed to fetch concerns:", error);
      toast.error("Failed to load concerns");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (concernId, newStatus) => {
    try {
      await updateConcernStatus(concernId, { status: newStatus });
      toast.success("Concern status updated");
      fetchConcerns();
    } catch (error) {
      console.error("Failed to update concern status:", error);
      toast.error("Failed to update concern status");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return theme.text.secondary;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'pending': return '#6B7280';
      default: return theme.text.secondary;
    }
  };

  const baseColor = isDarkMode ? '255, 212, 28' : '59, 130, 246';

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg.primary,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ position: "sticky", top: 0, zIndex: 1000 }}>
        <Header />
      </div>

      <div style={{ flex: 1, padding: "40px" }}>
        <Navbar />

        {/* Page Header */}
        <div
          className="mb-5 p-3 rounded-lg"
          style={{
            background: `rgba(${baseColor}, 0.1)`,
            borderBottom: `2px solid ${theme.accent.primary}`,
          }}
        >
          <h1
            className="text-2xl font-bold"
            style={{ color: theme.accent.primary }}
          >
            ⚠️ Concerns Management
          </h1>
        </div>

        {/* Filters */}
        <div
          className="mb-4 p-4 rounded-lg"
          style={{
            background: theme.bg.card,
            border: `1px solid rgba(${baseColor}, 0.2)`
          }}
        >
          <div className="grid grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Search concerns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: theme.bg.secondary,
                color: theme.text.primary,
                border: `1px solid rgba(${baseColor}, 0.3)`,
              }}
              className="px-3 py-2 rounded-md outline-none"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                background: theme.bg.secondary,
                color: theme.text.primary,
                border: `1px solid rgba(${baseColor}, 0.3)`,
              }}
              className="px-3 py-2 rounded-md outline-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{
                background: theme.bg.secondary,
                color: theme.text.primary,
                border: `1px solid rgba(${baseColor}, 0.3)`,
              }}
              className="px-3 py-2 rounded-md outline-none"
            >
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              onClick={fetchConcerns}
              style={{
                background: theme.accent.primary,
                color: theme.bg.primary,
              }}
              className="px-4 py-2 rounded-md font-semibold hover:opacity-80 transition"
            >
              🔍 Search
            </button>
          </div>
        </div>

        {/* Concerns List */}
        {loading ? (
          <div className="p-8 text-center" style={{ color: theme.text.secondary }}>
            Loading concerns...
          </div>
        ) : concerns.length === 0 ? (
          <div className="p-8 text-center" style={{ color: theme.text.secondary }}>
            No concerns found
          </div>
        ) : (
          <div className="space-y-3">
            {concerns.map((concern) => (
              <div
                key={concern._id}
                className="p-4 rounded-lg"
                style={{
                  background: theme.bg.card,
                  border: `1px solid rgba(${baseColor}, 0.2)`
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1" style={{ color: theme.text.primary }}>
                      {concern.title || concern.subject || "Untitled Concern"}
                    </h3>
                    <p className="text-sm mb-2" style={{ color: theme.text.secondary }}>
                      {concern.description || concern.message || "No description"}
                    </p>
                    <div className="flex gap-3 text-xs" style={{ color: theme.text.muted }}>
                      <span>From: {concern.userName || concern.user?.fullName || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(concern.createdAt).toLocaleString()}</span>
                      <span>•</span>
                      <span>Type: {concern.submissionType || 'general'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold text-center"
                      style={{
                        background: getPriorityColor(concern.priority),
                        color: '#fff'
                      }}
                    >
                      {concern.priority || 'medium'}
                    </span>

                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold text-center"
                      style={{
                        background: getStatusColor(concern.status),
                        color: '#fff'
                      }}
                    >
                      {concern.status || 'pending'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  {concern.status !== 'resolved' && (
                    <>
                      {concern.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(concern._id, 'in_progress')}
                          style={{
                            background: '#F59E0B',
                            color: '#fff'
                          }}
                          className="px-3 py-1 rounded-md text-xs font-semibold hover:opacity-80 transition"
                        >
                          Start Progress
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateStatus(concern._id, 'resolved')}
                        style={{
                          background: '#10B981',
                          color: '#fff'
                        }}
                        className="px-3 py-1 rounded-md text-xs font-semibold hover:opacity-80 transition"
                      >
                        Mark Resolved
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
