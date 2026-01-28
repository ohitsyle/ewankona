import React, { useState, useEffect, useRef } from "react";
import { Download, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

export default function LogsExportModal({ onClose, logs }) {
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportDateRange, setExportDateRange] = useState({ start: "", end: "" });
  const [selectedLogTypes, setSelectedLogTypes] = useState(["all"]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef(null);

  const LOG_TYPE_OPTIONS = [
    { label: "All Logs", value: "all" },
    { label: "💸 Credit", value: "transaction" },
    { label: "🧾 Debit", value: "cashout" },
    { label: "👤 Registrations", value: "registration" },
    { label: "🔒 Access Control", value: "access" },
  ];

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const parseLogDate = (log) => {
    if (log.date) {
      if (typeof log.date === 'string' && log.date.includes('/')) {
        const [day, month, year] = log.date.split('/');
        return new Date(`${year}-${month}-${day}`);
      }
      return new Date(log.date);
    }
    if (log.timestamp) return new Date(log.timestamp);
    if (log.createdAt) return new Date(log.createdAt);
    return null;
  };

  const toggleLogType = (value) => {
    if (value === "all") {
      setSelectedLogTypes(selectedLogTypes.includes("all") ? [] : ["all"]);
    } else {
      let updated = selectedLogTypes.includes(value)
        ? selectedLogTypes.filter((v) => v !== value)
        : [...selectedLogTypes.filter((v) => v !== "all"), value];
      if (updated.length === 0) updated = ["all"];
      setSelectedLogTypes(updated);
    }
  };

  const exportToCSV = (data) => {
    const headers = ["Date", "Time", "Event Type", "Event ID", "Title", "Description", "Severity", "User", "School UID"];
    const csvContent = [
      headers.join(","),
      ...data.map((log) => {
        const logDate = parseLogDate(log);
        const dateStr = logDate ? logDate.toLocaleDateString() : "N/A";
        const timeStr = logDate ? logDate.toLocaleTimeString() : "N/A";
        const userName = log.userId ? `${log.userId.firstName || ''} ${log.userId.lastName || ''}`.trim() : "N/A";
        const userSchoolUId = log.userId?.schoolUId || log.schoolUId || "N/A";
        
        return [
          dateStr,
          timeStr,
          log.eventType || "N/A",
          log.eventId || "N/A",
          `"${log.title || "N/A"}"`,
          `"${log.description || "N/A"}"`,
          log.severity || "N/A",
          `"${userName}"`,
          userSchoolUId,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `logs_${selectedLogTypes.join("-")}_${exportDateRange.start}_to_${exportDateRange.end}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    if (!logs || logs.length === 0) {
      toast.error("No logs available to export. Please make sure logs are loaded.");
      return;
    }
    if (!exportDateRange.start || !exportDateRange.end) {
      toast.error("Please select both start and end dates");
      return;
    }

    const startDate = new Date(exportDateRange.start);
    const endDate = new Date(exportDateRange.end);
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    const getEventTypesForCategory = (category) => {
      switch (category) {
        case "transaction": return ["payment", "cashin"];
        case "cashout": return ["cashout", "invoice"];
        case "registration": return ["registration"];
        case "access": return ["login", "logout", "security", "admin_action", "user_action"];
        default: return [];
      }
    };

    let eventTypes = [];
    if (!selectedLogTypes.includes("all")) {
      selectedLogTypes.forEach(type => {
        eventTypes = [...eventTypes, ...getEventTypesForCategory(type)];
      });
    }

    const filters = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (eventTypes.length > 0) {
      filters.eventType = { $in: eventTypes };
    }

    setIsExporting(true);

    try {
      const response = await fetch('http://localhost:4000/api/treasury/logs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ filters })
      });

      const result = await response.json();

      if (!result.success || result.count === 0) {
        toast.warning(result.message || "No logs found with the selected filters. Export cancelled.");
        setIsExporting(false);
        return;
      }

      // Export the data
      if (exportFormat === "csv") {
        exportToCSV(result.data);
        toast.success(`✅ Exported ${result.count} logs successfully!`);
      } else {
        toast.info(`${exportFormat.toUpperCase()} export feature coming soon`);
      }

      // ✅ Close modal AFTER a small delay to ensure toast is shown
      setTimeout(() => {
        onClose();
      }, 100);

    } catch (error) {
      console.error('❌ Export error:', error);
      toast.error("Failed to export logs. Please try again.");
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        if (!isExporting) onClose();
      }}
    >
      <div
        className="bg-[#1E2347] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fadeInScale shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-yellow-50/10 flex justify-between items-center px-6 py-2 z-10 border-b-2 border-yellow-400 backdrop-blur-md">
          <h3 className="text-yellow-400 font-extrabold text-s uppercase tracking-wide">Export Logs</h3>
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
            <label className="text-[11px] mb-2 block font-bold uppercase tracking-wide text-white/60">Export Format</label>
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

          {/* Log Type Dropdown */}
          <div className="p-4 rounded-xl bg-[#2A2F5D]" ref={dropdownRef}>
            <label className="text-[11px] mb-2 block font-bold uppercase tracking-wide text-white/60">Log Type</label>
            <div className="relative">
              <button
                type="button"
                disabled={isExporting}
                className="w-full px-4 py-2 rounded-lg bg-black/20 text-white border border-[rgba(255,212,28,0.2)] focus:border-[#FFD41C] focus:outline-none font-semibold flex justify-between items-center disabled:opacity-50"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {selectedLogTypes.includes("all")
                  ? "All Logs"
                  : selectedLogTypes
                      .map((v) => LOG_TYPE_OPTIONS.find((o) => o.value === v)?.label)
                      .join(", ")}
                <ChevronDown className="w-4 h-4" />
              </button>
              {dropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-[#2A2F5D] rounded-lg shadow-lg max-h-48 overflow-y-auto border border-[rgba(255,212,28,0.2)]">
                  {LOG_TYPE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center px-4 py-2 hover:bg-[#3A3F70] cursor-pointer text-white text-sm"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={selectedLogTypes.includes(opt.value)}
                        onChange={() => toggleLogType(opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Start Date */}
          <div className="p-4 rounded-xl bg-[#2A2F5D]">
            <label className="text-[11px] mb-2 block font-bold uppercase tracking-wide text-white/60">Start Date</label>
            <input
              type="date"
              value={exportDateRange.start}
              onChange={(e) => setExportDateRange({ ...exportDateRange, start: e.target.value })}
              disabled={isExporting}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 rounded-lg bg-black/20 text-white border border-[rgba(255,212,28,0.2)] focus:border-[#FFD41C] focus:outline-none font-semibold disabled:opacity-50"
            />
          </div>

          {/* End Date */}
          <div className="p-4 rounded-xl bg-[#2A2F5D]">
            <label className="text-[11px] mb-2 block font-bold uppercase tracking-wide text-white/60">End Date</label>
            <input
              type="date"
              value={exportDateRange.end}
              onChange={(e) => setExportDateRange({ ...exportDateRange, end: e.target.value })}
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
              className="flex-1 px-4 py-2 rounded-lg font-bold bg-[rgba(255,212,28,0.2)] text-yellow-400 hover:bg-[rgba(255,212,28,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <style>{`
        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fadeInScale { animation: fadeInScale 0.3s ease forwards; }
      `}</style>
    </div>
  );
}