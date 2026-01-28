// client/src/components/UserDashboard/ConcernsHistory.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { getUserConcerns } from "../../services/concernsApi";
import ConcernsDetailModal from "./ConcernsDetailModal";

export default function ConcernsHistory() {
  const { theme, isDarkMode } = useTheme();
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcern, setSelectedConcern] = useState(null);

  const loadConcerns = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Only fetch assistance reports, not feedback
      const response = await getUserConcerns({
        type: "assistance",
        limit: 50,
      });
      if (response.success) setConcerns(response.concerns);
    } catch (error) {
      // Silently handle error - backend endpoint may not exist yet
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId;

    const startInterval = () => {
      intervalId = setInterval(() => loadConcerns(true), 5000);
    };

    const stopInterval = () => {
      if (intervalId) clearInterval(intervalId);
    };

    loadConcerns(false);

    const handleVisibilityChange = () => {
      if (document.hidden) stopInterval();
      else {
        loadConcerns(true);
        startInterval();
      }
    };

    if (!document.hidden) startInterval();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "pending":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "closed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-white/10 text-white/60 border-white/20";
    }
  };

  return (
    <>
      <div
        style={{
          background: theme.bg.card,
          borderColor: theme.border.primary
        }}
        className="rounded-2xl border overflow-hidden"
      >
        {/* Header */}
        <div
          style={{ borderColor: theme.border.primary }}
          className="p-5 border-b"
        >
          <h3 style={{ color: theme.accent.primary }} className="m-0 mb-1 text-lg font-bold flex items-center gap-2">
            <span>📋</span>
            Concern Reports History
          </h3>
          <p style={{ color: theme.text.secondary }} className="m-0 text-xs">
            Track your assistance requests
          </p>
        </div>

        {/* Content */}
        <div className="p-5 h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div
                style={{ borderColor: theme.accent.primary, borderTopColor: 'transparent' }}
                className="animate-spin h-10 w-10 border-4 rounded-full"
              ></div>
            </div>
          ) : concerns.length === 0 ? (
            <div style={{ color: theme.text.tertiary }} className="text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-sm">No assistance reports found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {concerns.map((concern) => (
                <div
                  key={concern.id}
                  style={{
                    background: isDarkMode ? 'rgba(255,212,28,0.05)' : 'rgba(59,130,246,0.05)',
                    borderColor: theme.border.primary
                  }}
                  className="border rounded-lg p-4 hover:bg-white/5 transition cursor-pointer group"
                  onClick={() => setSelectedConcern(concern)}
                >
                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ color: theme.accent.primary }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </span>
                      <div>
                        <span style={{ color: theme.accent.primary }} className="font-mono text-xs font-semibold">
                          {concern.concernId}
                        </span>
                        <span style={{ color: theme.text.tertiary }} className="text-xs ml-2">
                          {new Date(concern.submittedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 text-xs rounded-full border font-medium ${getStatusBadge(
                        concern.status
                      )}`}
                    >
                      {concern.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Content Preview */}
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span style={{ color: theme.text.tertiary }} className="text-xs">To:</span>
                      <span style={{ color: theme.text.secondary }} className="text-xs font-medium">{concern.reportTo}</span>
                    </div>

                    {concern.selectedConcerns &&
                      concern.selectedConcerns.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span style={{ color: theme.text.tertiary }} className="text-xs">Issue:</span>
                          <div className="flex-1">
                            <p style={{ color: theme.text.secondary }} className="text-xs">
                              {concern.selectedConcerns[0]}
                              {concern.selectedConcerns.length > 1 && (
                                <span style={{ color: theme.accent.primary }} className="ml-1">
                                  +{concern.selectedConcerns.length - 1} more
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedConcern && (
        <ConcernsDetailModal concern={selectedConcern} onClose={() => setSelectedConcern(null)} />
      )}
    </>
  );
}