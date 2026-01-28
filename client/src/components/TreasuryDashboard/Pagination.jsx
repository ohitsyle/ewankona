// client/src/components/TreasuryDashboard/Pagination.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  totalItems,
  startIndex,
  rowsPerPageOptions = [10, 20, 50, 100], // default options
}) {
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  const [rowsDropdownOpen, setRowsDropdownOpen] = useState(false);
  const rowsDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rowsDropdownRef.current && !rowsDropdownRef.current.contains(event.target)) {
        setRowsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-[#FFD41C] px-4 py-2 flex flex-wrap justify-between items-center gap-3 rounded-b-xl">
      {/* Rows per page */}
      <div className="flex items-center gap-2">
        <span className="text-[#121C52] font-bold text-xs">Rows per page:</span>

        {/* Custom dropdown wrapper */}
        <div className="relative inline-block w-20" ref={rowsDropdownRef}>
          <button
            onClick={() => setRowsDropdownOpen(prev => !prev)}
            className="bg-[#121C52] text-[#FFD41C] px-2 h-6 text-sm rounded hover:bg-[#2a3472] transition-colors w-full flex items-center justify-center relative"
          >
            <span className="absolute left-1/2 transform -translate-x-1/2">{rowsPerPage}</span>
            <svg
              className="w-3 h-3 text-[#FFD41C] ml-2 flex-shrink-0 absolute right-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {rowsDropdownOpen && (
            <div className="absolute bottom-full mb-1 left-0 bg-[#121C52] text-[#FFD41C] rounded w-full z-50 shadow-lg">
              {rowsPerPageOptions.map(option => (
                <button
                  key={option}
                  className="block w-full px-2 py-1 text-sm text-center hover:bg-[#FFD41C] hover:text-[#121C52] transition-colors"
                  onClick={() => {
                    setRowsPerPage(option);
                    setCurrentPage(1);
                    setRowsDropdownOpen(false);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-[#121C52] font-semibold text-xs">
          Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems}
        </span>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="text-[#121C52] hover:text-[#35408E] p-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1">
          <span className="text-[#121C52] font-bold text-sm">
            {currentPage}
          </span>
        </div>

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="text-[#121C52] hover:text-[#35408E] p-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}