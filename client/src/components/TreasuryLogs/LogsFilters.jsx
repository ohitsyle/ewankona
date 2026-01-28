import React, { useRef, useEffect, useState } from "react";
import { Search, Calendar, Download } from "lucide-react";

export default function LogsFilters({
  searchQuery,
  setSearchQuery,
  logType,
  setLogType,
  dateFilter,
  setDateFilter,
  onExport, 
  logs
}) {
  const calendarRef = useRef(null);
  const dateDropdownRef = useRef(null);
  const logTypeDropdownRef = useRef(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [logTypeDropdownOpen, setLogTypeDropdownOpen] = useState(false);

  const DATE_OPTIONS = ["All Time", "Today", "Last 7 Days", "Last 30 Days"];
  const LOG_TYPE_OPTIONS = [
    { label: "All Logs", value: "all" },
    { label: "💸 Credit", value: "transaction" },
    { label: "🧾 Debit", value: "cashout" },
    { label: "👤 Registrations", value: "registration" },
    { label: "🔒 Access Control", value: "access" },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setCalendarOpen(false);
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) setDateDropdownOpen(false);
      if (logTypeDropdownRef.current && !logTypeDropdownRef.current.contains(e.target)) setLogTypeDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getLogTypeLabel = () => {
    const found = LOG_TYPE_OPTIONS.find(opt => opt.value === logType);
    return found ? found.label : "All Logs";
  };

  const getDateFilterLabel = () => {
    if (DATE_OPTIONS.includes(dateFilter)) {
      return dateFilter;
    }
    if (dateFilter && /^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
      return dateFilter;
    }
    return "All Time";
  };

  return (
    <div className="bg-[#FFD41C] rounded-t-xl shadow px-6 py-4 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#121C52]" />
          <input
            type="text"
            placeholder="Search by ID, user, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border-2 border-[#121C52]
                       focus:outline-none focus:ring-2 focus:ring-[#121C52]
                       text-sm text-[#121C52] placeholder:text-[#121C52]/50 bg-white"
          />
        </div>
        
        {/* Calendar */}
        <div className="relative" ref={calendarRef}>
          <button
            onClick={() => setCalendarOpen(prev => !prev)}
            className="bg-[#121C52] text-[#FFD41C] p-2 rounded hover:bg-[#2a3472]"
          >
            <Calendar className="w-4 h-4" />
          </button>
          {calendarOpen && (
            <input
              type="date"
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCalendarOpen(false);
              }}
              className="absolute top-10 right-0 bg-[#121C52] text-[#FFD41C]
                         border border-white/20 rounded p-2 z-50"
              max={new Date().toISOString().split("T")[0]}
            />
          )}
        </div>
        
        {/* Date Range */}
        <div className="relative" ref={dateDropdownRef}>
          <button
            onClick={() => setDateDropdownOpen(prev => !prev)}
            className="bg-[#121C52] text-[#FFD41C] px-4 py-2 text-sm rounded
                       hover:bg-[#2a3472] min-w-[130px] flex justify-between items-center"
          >
            <span>{getDateFilterLabel()}</span>
            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {dateDropdownOpen && (
            <div className="absolute top-full mt-1 right-0 bg-[#121C52] text-[#FFD41C]
                            border border-white/20 rounded w-40 z-50 shadow-lg">
              {DATE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  className="block w-full px-4 py-2 text-left text-sm
                             hover:bg-[#FFD41C] hover:text-[#121C52] transition-colors"
                  onClick={() => {
                    setDateFilter(opt);
                    setDateDropdownOpen(false);
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Log Type Dropdown */}
        <div className="relative" ref={logTypeDropdownRef}>
          <button
            onClick={() => setLogTypeDropdownOpen(prev => !prev)}
            className="bg-[#121C52] text-[#FFD41C] px-4 py-2 text-sm rounded
                       hover:bg-[#2a3472] min-w-[160px] flex justify-between items-center"
          >
            <span>{getLogTypeLabel()}</span>
            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {logTypeDropdownOpen && (
            <div className="absolute top-full mt-1 right-0 bg-[#121C52] text-[#FFD41C]
                            border border-white/20 rounded w-56 z-50 shadow-lg">
              {LOG_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className="block w-full px-4 py-2 text-left text-sm
                             hover:bg-[#FFD41C] hover:text-[#121C52] transition-colors"
                  onClick={() => {
                    setLogType(opt.value);
                    setLogTypeDropdownOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={onExport}
          className="bg-[#121C52] text-[#FFD41C] px-4 py-2 text-sm rounded
                     hover:bg-[#2a3472] flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  );
}