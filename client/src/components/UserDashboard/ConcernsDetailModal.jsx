// client/src/components/UserDashboard/ConcernsDetailModal.jsx
import React, { useEffect } from "react";

export default function ConcernsDetailModal({ concern, onClose }) {
  if (!concern) return null;

  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return `${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}, ${date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const isAssistance = concern.submissionType === "assistance";

  const headerTitle = isAssistance ? "Concern Details" : "Feedback Details";
  const sectionTitle = isAssistance ? "Concern Information" : "Feedback Information";

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#1E2347] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeInScale shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-yellow-50/10 border-b-2 border-yellow-400 flex justify-between items-center px-6 py-2 z-10 backdrop-blur-md">
          <h3 className="text-yellow-400 font-extrabold text-s uppercase tracking-wide">
            {headerTitle}
          </h3>
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-red-200 text-red-500 hover:scale-110 transition"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="p-5 rounded-xl bg-[#2A2F5D]">
            <h4 className="text-[13px] text-yellow-400 uppercase font-bold tracking-wide mb-4">
              {sectionTitle}
            </h4>

            <div className="space-y-3 text-[13px] text-white">
              {/* Concern ID */}
              <div>
                <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">
                  Concern ID
                </label>
                <p className="bg-black/20 p-2 rounded-md font-mono">{concern.concernId}</p>
              </div>

              {/* Submitted On */}
              <div>
                <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">
                  Submitted On
                </label>
                <p className="bg-black/20 p-2 rounded-md font-semibold">
                  {formatDateTime(concern.submittedAt)}
                </p>
              </div>

              {/* Type */}
              <div>
                <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">
                  Type
                </label>
                <p className="bg-black/20 p-2 rounded-md font-semibold">{concern.submissionType}</p>
              </div>

              {/* Report To */}
              {concern.reportTo && (
                <div>
                  <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">
                    Report To
                  </label>
                  <p className="bg-black/20 p-2 rounded-md font-semibold">{concern.reportTo}</p>
                </div>
              )}

              {/* Subject */}
              {concern.subject && concern.subject !== 'No subject' && (
                <div>
                  <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">
                    Subject
                  </label>
                  <p className="bg-black/20 p-2 rounded-md font-semibold">{concern.subject}</p>
                </div>
              )}

              {/* Feedback Text (Feedback only) */}
              {concern.submissionType === "feedback" && concern.feedbackText && concern.feedbackText.trim() && (
                <div>
                  <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">
                    Tell us more about your experience
                  </label>
                  <p className="bg-black/20 p-2 rounded-md font-mono">{concern.feedbackText}</p>
                </div>
              )}

              {/* Feedback Rating */}
              {concern.submissionType === "feedback" && concern.rating !== undefined && (
                <div>
                  <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">
                    Rating
                  </label>
                  <p className="bg-black/20 p-2 rounded-md font-semibold">
                    {"⭐".repeat(concern.rating)}
                  </p>
                </div>
              )}

              {/* Assistance FeedbackText */}
              {concern.submissionType === "assistance" && concern.feedbackText && concern.feedbackText.trim() && (
                <div>
                  <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">
                    Other Concerns
                  </label>
                  <p className="bg-black/20 p-2 rounded-md font-mono">{concern.feedbackText}</p>
                </div>
              )}

              {/* Status (Assistance only) */}
              {concern.submissionType === "assistance" && concern.status && (
                <div>
                  <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">
                    Status
                  </label>
                  <p className="bg-black/20 p-2 rounded-md font-semibold capitalize">
                    {concern.status.replace("_", " ")}
                  </p>
                </div>
              )}

              {/* Resolution */}
              {concern.resolution && concern.resolution.trim() && (
                <div>
                  <label className="block text-[11px] text-gray-400 uppercase font-bold mb-1">
                    Resolution
                  </label>
                  <p className="bg-black/20 p-2 rounded-md font-semibold">{concern.resolution}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes fadeInScale {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-fadeInScale {
            animation: fadeInScale 0.3s ease forwards;
          }
        `}
      </style>
    </div>
  );
}