// src/admin/components/Trips/TripsList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import SearchBar from '../../../components/shared/SearchBar';
import ExportButton from '../../../components/shared/ExportButton';
import StatusFilter from '../../../components/shared/StatusFilter';
import DateRangeFilter from '../../../components/shared/DateRangeFilter';
import TripDetailModal from '../../../components/modals/TripDetailModal';
import { exportToCSV, prepareDataForExport } from '../../../utils/csvExport';
import { useTheme } from '../../../context/ThemeContext';

export default function TripsList() {
  const { theme, isDarkMode } = useTheme();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const loadTrips = async () => {
    try {
      const data = await api.get('/admin/trips');
      setTrips(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading trips:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
    const interval = setInterval(loadTrips, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    const dataToExport = prepareDataForExport(filteredTrips);
    exportToCSV(dataToExport, 'trips');
  };

  const filteredTrips = trips.filter(trip => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        trip._id?.toLowerCase().includes(searchLower) ||
        trip.shuttleId?.toLowerCase().includes(searchLower) ||
        trip.driverId?.toLowerCase().includes(searchLower) ||
        trip.routeId?.toLowerCase().includes(searchLower) ||
        trip.startLocationName?.toLowerCase().includes(searchLower) ||
        trip.endLocationName?.toLowerCase().includes(searchLower) ||
        trip.status?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter && trip.status !== statusFilter) return false;

    // Date range filter
    if (startDate || endDate) {
      const tripDate = new Date(trip.departureTime);
      if (startDate && tripDate < new Date(startDate)) return false;
      if (endDate && tripDate > new Date(endDate + 'T23:59:59')) return false;
    }

    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredTrips.slice(startIndex, endIndex);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, startDate, endDate]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return { bg: 'rgba(34,197,94,0.2)', color: '#22C55E' };
      case 'in_progress': return { bg: 'rgba(59,130,246,0.2)', color: '#3B82F6' };
      case 'cancelled': return { bg: 'rgba(239,68,68,0.2)', color: '#EF4444' };
      default: return { bg: 'rgba(107,114,128,0.2)', color: '#6B7280' };
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return <div className="text-center py-[60px]" style={{ color: theme.accent.primary }}>Loading trips...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-[30px] pb-5" style={{ borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]" style={{ color: theme.accent.primary }}>
            <span>🚐</span> Trip Management
          </h2>
          <p className="text-[13px] m-0" style={{ color: theme.text.secondary }}>
            {filteredTrips.length > 0
              ? `Showing ${startIndex + 1}-${Math.min(endIndex, filteredTrips.length)} of ${filteredTrips.length} • Page ${currentPage} of ${totalPages}`
              : `Track all shuttle trips • Total: ${trips.length}`
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by shuttle, driver, route, or location..."
          />
          <StatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
            label="Status"
            options={[
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
          />
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
          <ExportButton onClick={handleExport} disabled={filteredTrips.length === 0} />
        </div>
      </div>

      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto pr-2">
      {trips.length === 0 ? (
        <div className="text-center py-[60px] text-[rgba(251,251,251,0.5)]">
          <div className="text-5xl mb-4">🚐</div>
          <div>No trips found</div>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-[60px] text-[rgba(251,251,251,0.5)]">
          <div className="text-5xl mb-4">🔍</div>
          <div style={{ marginBottom: '12px' }}>No trips match your search</div>
          <button onClick={() => setSearchQuery('')} style={{
            padding: '8px 16px',
            background: isDarkMode ? 'rgba(255,212,28,0.15)' : 'rgba(59,130,246,0.15)',
            border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
            borderRadius: '8px',
            color: theme.accent.primary,
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Clear Search
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ background: isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)' }}>
                <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Trip ID</th>
                <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Shuttle</th>
                <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Driver</th>
                <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Route</th>
                <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Departure</th>
                <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Duration</th>
                <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Passengers</th>
                <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Revenue</th>
                <th className="text-left p-4 text-[11px] font-extrabold uppercase" style={{ color: theme.accent.primary, borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Status</th>
                <th style={{ textAlign: 'right', padding: '16px', fontSize: '11px', fontWeight: 800, color: theme.accent.primary, textTransform: 'uppercase', borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}` }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((trip) => {
                const statusStyle = getStatusColor(trip.status);
                return (
                  <tr key={trip._id} style={{ borderBottom: `1px solid ${theme.border.primary}` }}>
                    <td style={{ padding: '16px', color: theme.text.primary, fontFamily: 'monospace', fontSize: '11px', fontWeight: 700 }}>
                      {trip.tripId || trip._id.slice(-8)}
                    </td>
                    <td style={{ padding: '16px', color: theme.text.primary, fontWeight: 600 }}>
                      {trip.shuttleId}
                    </td>
                    <td style={{ padding: '16px', color: theme.text.primary }}>
                      {trip.driverName || trip.driverId}
                    </td>
                    <td style={{ padding: '16px', color: theme.text.primary }}>
                      {trip.routeId}
                    </td>
                    <td style={{ padding: '16px', color: theme.text.primary }}>
                      {new Date(trip.departureTime).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', color: theme.text.primary }}>
                      {formatDuration(trip.durationMinutes)}
                    </td>
                    <td style={{ padding: '16px', color: theme.text.primary, textAlign: 'center' }}>
                      {trip.passengerCount || 0}
                    </td>
                    <td style={{ padding: '16px', color: theme.text.primary, fontWeight: 600 }}>
                      ₱{(trip.totalCollections || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.color}40`
                      }}>
                        {trip.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedTrip(trip)}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(59,130,246,0.2)',
                          color: '#3B82F6',
                          border: '1px solid rgba(59,130,246,0.3)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  background: currentPage === 1 ? (isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)') : (isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'),
                  border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                  borderRadius: '8px',
                  color: currentPage === 1 ? 'rgba(251,251,251,0.3)' : theme.accent.primary,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Previous
              </button>
              <span style={{ color: 'rgba(251,251,251,0.7)', fontSize: '13px', fontWeight: 600 }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  background: currentPage === totalPages ? (isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)') : (isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'),
                  border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                  borderRadius: '8px',
                  color: currentPage === totalPages ? 'rgba(251,251,251,0.3)' : theme.accent.primary,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <TripDetailModal
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
          onUpdate={(updatedTrip) => {
            // Update the trip in the list
            setTrips(trips.map(t => t._id === updatedTrip._id ? updatedTrip : t));
            setSelectedTrip(updatedTrip);
          }}
        />
      )}
    </div>
  );
}
