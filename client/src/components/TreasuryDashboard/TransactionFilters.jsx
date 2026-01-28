// client/src/components/TreasuryDashboard/TransactionFilters.jsx
import React, { useRef, useEffect } from 'react';
import { Search, Calendar, Download } from 'lucide-react';

export default function TransactionFilters({
  searchQuery,
  setSearchQuery,
  filterOption,
  setFilterOption,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  selectedDate,
  setSelectedDate,
  onExport,
  totalCount,
  filteredCount
}) {
  const dropdownRef = useRef(null);
  const calendarRef = useRef(null);
  const typeDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = React.useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(false);

  const FILTER_OPTIONS = ["Today", "Last 7 Days", "Last 30 Days", "All Time"];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setCalendarOpen(false);
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) setTypeDropdownOpen(false);
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) setStatusDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateChange = (e) => {
    const value = e.target.value;
    if (value) {
      const dateObj = new Date(value);
      const formatted = dateObj.toLocaleDateString("en-GB");
      setSelectedDate(formatted);
      setFilterOption(formatted);
      setCalendarOpen(false);
    }
  };

  const getTypeLabel = () => typeFilter === 'all' ? 'Type: All' : `Type: ${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}`;
  const getStatusLabel = () => statusFilter === 'all' ? 'Status: All' : `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`;

  return (
    <div className="bg-[#FFD41C] rounded-t-xl shadow px-6 py-4 flex flex-col gap-4">
      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#121C52]" />
          <input
            type="text"
            placeholder="Search by ID, Name, or Transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border-2 border-[#121C52] focus:outline-none focus:ring-2 focus:ring-[#121C52] text-sm text-[#121C52] placeholder:text-[#121C52]/50 bg-white"
          />
        </div>

        {/* Calendar */}
        <div className="relative" ref={calendarRef}>
          <button
            onClick={() => setCalendarOpen(prev => !prev)}
            className="bg-[#121C52] text-[#FFD41C] p-2 rounded hover:bg-[#2a3472] transition-colors"
          >
            <Calendar className="w-4 h-4" />
          </button>
          {calendarOpen && (
            <input
              type="date"
              onChange={handleDateChange}
              className="absolute top-10 right-0 bg-[#121C52] text-[#FFD41C] border border-white/20 rounded p-2 z-50"
              max={new Date().toISOString().split('T')[0]}
            />
          )}
        </div>

        {/* Time Period */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="bg-[#121C52] text-[#FFD41C] px-4 py-2 text-sm rounded hover:bg-[#2a3472] transition-colors min-w-[140px] text-left flex items-center justify-between"
          >
            <span className="truncate">{filterOption}</span>
            <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute top-10 right-0 bg-[#121C52] text-[#FFD41C] border border-white/20 rounded w-40 z-50 shadow-lg">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt}
                  className="block px-4 py-2 w-full text-left hover:bg-[#FFD41C] hover:text-[#121C52] transition-colors text-sm"
                  onClick={() => {
                    setSelectedDate(null);
                    setFilterOption(opt);
                    setDropdownOpen(false);
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type */}
        <div className="relative" ref={typeDropdownRef}>
          <button
            onClick={() => setTypeDropdownOpen(prev => !prev)}
            className="bg-[#121C52] text-[#FFD41C] px-4 py-2 text-sm rounded hover:bg-[#2a3472] transition-colors min-w-[100px] text-left flex items-center justify-between"
          >
            <span className="truncate">{getTypeLabel()}</span>
            <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {typeDropdownOpen && (
            <div className="absolute top-10 right-0 bg-[#121C52] text-[#FFD41C] border border-white/20 rounded w-32 z-50 shadow-lg">
              {['all','credit','debit'].map(type => (
                <button
                  key={type}
                  className="block px-4 py-2 w-full text-left hover:bg-[#FFD41C] hover:text-[#121C52] transition-colors text-sm"
                  onClick={() => { setTypeFilter(type); setTypeDropdownOpen(false); }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="relative" ref={statusDropdownRef}>
          <button
            onClick={() => setStatusDropdownOpen(prev => !prev)}
            className="bg-[#121C52] text-[#FFD41C] px-4 py-2 text-sm rounded hover:bg-[#2a3472] transition-colors min-w-[120px] text-left flex items-center justify-between"
          >
            <span className="truncate">{getStatusLabel()}</span>
            <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {statusDropdownOpen && (
            <div className="absolute top-10 right-0 bg-[#121C52] text-[#FFD41C] border border-white/20 rounded w-36 z-50 shadow-lg">
              {['all','completed','failed','pending'].map(status => (
                <button
                  key={status}
                  className="block px-4 py-2 w-full text-left hover:bg-[#FFD41C] hover:text-[#121C52] transition-colors text-sm"
                  onClick={() => { setStatusFilter(status); setStatusDropdownOpen(false); }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export */}
        <button
          onClick={onExport}
          className="bg-[#121C52] text-[#FFD41C] px-4 py-2 text-sm rounded hover:bg-[#2a3472] transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  );
}
