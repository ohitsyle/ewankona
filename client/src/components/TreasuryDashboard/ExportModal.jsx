import React, { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { toast } from "react-toastify";
import { exportTransactions } from "../../services/treasuryApi";

export default function ExportModal({ onClose, transactions }) {
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportDateRange, setExportDateRange] = useState({ start: "", end: "" });
  const [isExporting, setIsExporting] = useState(false);

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleExport = async () => {
    if (!exportDateRange.start || !exportDateRange.end) {
      toast.error("Please select both start and end dates");
      return;
    }

    const startDate = new Date(exportDateRange.start);
    const endDate = new Date(exportDateRange.end);

    if (startDate > endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    try {
      setIsExporting(true);

      // ✅ Call backend API to export and log the action
      const response = await exportTransactions(
        exportDateRange.start,
        exportDateRange.end,
        exportFormat
      );

      if (!response.success) {
        toast.error(response.message || "Export failed");
        return;
      }

      if (response.count === 0) {
        toast.warning("No transactions found in the selected date range");
        return;
      }

      // ✅ Download the exported data
      if (exportFormat === "csv") {
        downloadCSV(response.data);
        toast.success(`✅ Exported ${response.count} transactions successfully!`);
      } else {
        toast.info(`${exportFormat.toUpperCase()} export feature coming soon`);
      }

      onClose();
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error.message || "Failed to export transactions");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadCSV = (data) => {
    const headers = [
      "Transaction ID",
      "Date",
      "Time",
      "ID Number",
      "Name",
      "Email",
      "Amount",
      "Type",
      "Status",
      "Balance After",
      "Admin Name",
      "Admin Email",
      "Admin ID"
    ];

    const csvContent = [
      headers.join(","),
      ...data.map((tx) =>
        [
          tx.transactionId,
          tx.date,
          tx.time,
          tx.idNumber,
          `"${tx.userName || "N/A"}"`,
          tx.email,
          tx.amount,
          tx.transactionType || "credit",
          tx.status,
          tx.balance || 0,
          `"${tx.adminName || "N/A"}"`,
          tx.adminEmail || "N/A",
          tx.adminSchoolId || "N/A"
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions_${exportDateRange.start}_to_${exportDateRange.end}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="sticky top-0 bg-yellow-50/10 flex justify-between items-center px-6 py-2 z-10 border-b-2 border-yellow-400">
          <h3 className="text-yellow-400 font-extrabold text-s uppercase tracking-wide">
            Export Transactions
          </h3>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-red-200 text-red-500 hover:scale-110 transition disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Export Format */}
          <div className="p-4 rounded-xl bg-[#2A2F5D]">
            <label className="text-[11px] mb-2 block font-bold uppercase tracking-wide text-white/60">
              Export Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              disabled={isExporting}
              className="w-full px-4 py-2 rounded-lg bg-black/20 text-white border border-[rgba(255,212,28,0.2)] focus:border-[#FFD41C] focus:outline-none font-semibold disabled:opacity-50"
            >
              <option value="csv">CSV (Excel Compatible)</option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="pdf">PDF Report</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="p-4 rounded-xl bg-[#2A2F5D]">
            <label className="text-[11px] mb-2 block font-bold uppercase tracking-wide text-white/60">
              Start Date
            </label>
            <input
              type="date"
              value={exportDateRange.start}
              onChange={(e) =>
                setExportDateRange({ ...exportDateRange, start: e.target.value })
              }
              disabled={isExporting}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 rounded-lg bg-black/20 text-white border border-[rgba(255,212,28,0.2)] focus:border-[#FFD41C] focus:outline-none font-semibold disabled:opacity-50"
            />
          </div>

          {/* End Date */}
          <div className="p-4 rounded-xl bg-[#2A2F5D]">
            <label className="text-[11px] mb-2 block font-bold uppercase tracking-wide text-white/60">
              End Date
            </label>
            <input
              type="date"
              value={exportDateRange.end}
              onChange={(e) =>
                setExportDateRange({ ...exportDateRange, end: e.target.value })
              }
              disabled={isExporting}
              max={new Date().toISOString().split("T")[0]}
              min={exportDateRange.start}
              className="w-full px-4 py-2 rounded-lg bg-black/20 text-white border border-[rgba(255,212,28,0.2)] focus:border-[#FFD41C] focus:outline-none font-semibold disabled:opacity-50"
            />
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-xl bg-[#2A2F5D]">
            <p className="text-white/70 text-xs">
              <strong className="text-yellow-400">Note:</strong> This export will be logged in the system.
              Currently only CSV export is fully functional. Excel and PDF export features are coming soon.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="flex-1 px-4 py-2 rounded-lg font-bold bg-gray-500/20 text-gray-200 hover:bg-gray-500/30 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 px-4 py-2 rounded-lg font-bold bg-[rgba(255,212,28,0.2)] text-yellow-400 hover:bg-[rgba(255,212,28,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
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