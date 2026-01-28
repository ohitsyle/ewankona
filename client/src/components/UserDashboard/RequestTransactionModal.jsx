// client/src/components/UserDashboard/RequestTransactionModal.jsx
import React, { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import { toast } from "react-toastify";
import { requestTransactionHistory } from "../../services/userApi";

export default function RequestTransactionModal({ onClose }) {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [loading, setLoading] = useState(false);

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleRequest = async () => {
    if (!dateRange.start || !dateRange.end) {
      toast.error("Please select both start and end dates");
      return;
    }

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    if (startDate > endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (days > 60) {
      toast.error("Date range cannot exceed 60 days");
      return;
    }

    try {
      setLoading(true);
      const res = await requestTransactionHistory(
        dateRange.start,
        dateRange.end
      );

      if (res.success) {
        toast.success(
          "Request sent successfully. Your transaction history will be emailed."
        );
        onClose();
      } else {
        toast.error(res.message || "Failed to request transaction history");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1E2347] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fadeInScale shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-yellow-50/10 flex justify-between items-center px-6 py-2 border-b-2 border-yellow-400">
          <h3 className="text-yellow-400 font-extrabold text-sm uppercase tracking-wide">
            Request Transaction History
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-red-200 text-red-500 hover:scale-110 transition"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Info */}
          <div className="p-4 rounded-xl bg-[#2A2F5D]">
            <p className="text-white/70 text-xs">
              <strong className="text-yellow-400">📧 Email Delivery:</strong>{" "}
              Your transaction history will be sent as a PDF to your registered
              email address.
            </p>
          </div>

          {/* Start Date */}
          <div className="p-4 rounded-xl bg-[#2A2F5D]">
            <label className="text-[11px] mb-2 block font-bold uppercase tracking-wide text-white/60">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 rounded-lg bg-black/20 text-white border border-yellow-400/20 focus:border-[#FFD41C] focus:outline-none font-semibold"
              disabled={loading}
            />
          </div>

          {/* End Date */}
          <div className="p-4 rounded-xl bg-[#2A2F5D]">
            <label className="text-[11px] mb-2 block font-bold uppercase tracking-wide text-white/60">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              min={dateRange.start}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 rounded-lg bg-black/20 text-white border border-yellow-400/20 focus:border-[#FFD41C] focus:outline-none font-semibold"
              disabled={loading}
            />
          </div>

          {/* Note */}
          <div className="p-4 rounded-xl bg-[#2A2F5D]">
            <p className="text-white/70 text-xs">
              <strong className="text-yellow-400">Note:</strong> You can request
              up to <strong>60 days</strong> of transaction history at a time.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg font-bold bg-gray-500/20 text-gray-200 hover:bg-gray-500/30 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleRequest}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg font-bold bg-[rgba(255,212,28,0.2)] text-yellow-400 hover:bg-[rgba(255,212,28,0.3)] transition flex items-center justify-center gap-2"
            >
              {loading ? "Sending..." : <>
                <Send className="w-4 h-4" />
                Request
              </>}
            </button>
          </div>
        </div>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fadeInScale {
          animation: fadeInScale 0.3s ease forwards;
        }
      `}</style>
    </div>
  );
}
