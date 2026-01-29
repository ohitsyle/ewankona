// src/admin/components/Logs/LogsList.jsx
// Enhanced with pagination and detail view
import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import SearchBar from '../../../components/shared/SearchBar';
import ExportButton from '../../../components/shared/ExportButton';
import StatusFilter from '../../../components/shared/StatusFilter';
import DateRangeFilter from '../../../components/shared/DateRangeFilter';
import { exportToCSV, prepareDataForExport} from '../../../utils/csvExport';
import LogDetailModal from '../../../components/modals/LogDetailModal';

export default function LogsList() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;
  const [adminData] = useState(() => {
    const data = localStorage.getItem('adminData');
    return data ? JSON.parse(data) : null;
  });

  const loadLogs = async () => {
    try {
      const data = await api.get('/admin/event-logs');
      setLogs(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading logs:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    const dataToExport = prepareDataForExport(filteredLogs);
    exportToCSV(dataToExport, 'event-logs');
  };

  const filteredLogs = logs.filter(log => {
    // Filter by admin role
    if (adminData?.role === 'motorpool') {
      // Motorpool admins see all logs related to drivers, shuttles, routes, trips, concerns, and motorpool operations
      const isMotorpoolRelated =
        log.driverId ||
        log.shuttleId ||
        log.routeId ||
        log.tripId ||
        log.eventType === 'route_start' ||
        log.eventType === 'route_end' ||
        log.eventType === 'driver_assignment' ||
        log.eventType === 'shuttle_assignment' ||
        log.eventType === 'trip_start' ||
        log.eventType === 'trip_end' ||
        log.eventType === 'trip_created' ||
        log.eventType === 'trip_completed' ||
        log.eventType === 'trip_cancelled' ||
        log.eventType === 'driver_created' ||
        log.eventType === 'driver_updated' ||
        log.eventType === 'driver_deleted' ||
        log.eventType === 'shuttle_created' ||
        log.eventType === 'shuttle_updated' ||
        log.eventType === 'shuttle_deleted' ||
        log.eventType === 'route_created' ||
        log.eventType === 'route_updated' ||
        log.eventType === 'route_deleted' ||
        log.eventType === 'phone_assigned' ||
        log.eventType === 'phone_unassigned' ||
        log.eventType === 'concern_resolved' ||
        log.eventType === 'concern_updated' ||
        log.eventType === 'payment' ||
        log.eventType === 'passenger_boarding' ||
        log.eventType === 'passenger_alighting' ||
        log.eventType === 'gps_update' ||
        log.eventType === 'admin_action' ||
        log.title?.toLowerCase().includes('driver') ||
        log.title?.toLowerCase().includes('shuttle') ||
        log.title?.toLowerCase().includes('route') ||
        log.title?.toLowerCase().includes('trip') ||
        log.title?.toLowerCase().includes('motorpool') ||
        log.title?.toLowerCase().includes('concern') ||
        log.description?.toLowerCase().includes('driver') ||
        log.description?.toLowerCase().includes('shuttle') ||
        log.description?.toLowerCase().includes('route') ||
        log.description?.toLowerCase().includes('trip') ||
        log.description?.toLowerCase().includes('motorpool') ||
        log.targetEntity === 'driver' ||
        log.targetEntity === 'shuttle' ||
        log.targetEntity === 'route' ||
        log.targetEntity === 'trip' ||
        log.targetEntity === 'concern' ||
        log.targetEntity === 'phone';
      if (!isMotorpoolRelated) return false;
    } else if (adminData?.role === 'merchant') {
      // Merchant admins only see logs related to merchants, payments, transactions
      const isMerchantRelated =
        log.eventType === 'payment' ||
        log.eventType === 'admin_action' ||
        log.title?.toLowerCase().includes('merchant') ||
        log.description?.toLowerCase().includes('merchant');
      if (!isMerchantRelated) return false;
    }

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = (
        log.eventType?.toLowerCase().includes(searchLower) ||
        log.type?.toLowerCase().includes(searchLower) ||
        log.title?.toLowerCase().includes(searchLower) ||
        log.description?.toLowerCase().includes(searchLower) ||
        log.message?.toLowerCase().includes(searchLower) ||
        log.severity?.toLowerCase().includes(searchLower) ||
        new Date(log.timestamp).toLocaleString().toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }
    if (severityFilter && log.severity !== severityFilter) return false;
    if (typeFilter && (log.eventType || log.type) !== typeFilter) return false;
    if (startDate || endDate) {
      const logDate = new Date(log.timestamp);
      if (startDate && logDate < new Date(startDate)) return false;
      if (endDate && logDate > new Date(endDate + 'T23:59:59')) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, severityFilter, typeFilter, startDate, endDate]);

  if (loading) {
    return <div className="text-center py-[60px] text-[#FFD41C]">Loading logs...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-[30px] border-b-2 border-[rgba(255,212,28,0.2)] pb-5">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-[#FFD41C] m-0 mb-2 flex items-center gap-[10px]">
            <span>📋</span> System Event Logs
          </h2>
          <p className="text-[13px] text-[rgba(251,251,251,0.6)] m-0">
            Showing {filteredLogs.length} logs • Page {currentPage} of {Math.max(1, totalPages)}
          </p>
        </div>
        <div className="flex gap-3 items-end flex-wrap">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search logs..." />
          <StatusFilter value={severityFilter} onChange={setSeverityFilter} label="Severity"
            options={[{ value: 'info', label: 'Info' }, { value: 'warning', label: 'Warning' }, { value: 'error', label: 'Error' }]} />
          <StatusFilter value={typeFilter} onChange={setTypeFilter} label="Type"
            options={[{ value: 'admin_action', label: 'Admin Action' }, { value: 'system_event', label: 'System Event' }, { value: 'user_action', label: 'User Action' }]} />
          <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
          <ExportButton onClick={handleExport} disabled={filteredLogs.length === 0} />
        </div>
      </div>

      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto pr-2">
      {filteredLogs.length === 0 ? (
        <div className="text-center py-[60px] text-[rgba(251,251,251,0.5)]">
          <div className="text-5xl mb-4">🔍</div>
          <div>No logs found</div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[rgba(255,212,28,0.2)] mb-5">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[rgba(255,212,28,0.1)]">
                  <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Timestamp</th>
                  <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Actor</th>
                  <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Action</th>
                  <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Details</th>
                  <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Location</th>
                  <th className="text-left p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Severity</th>
                  <th className="text-center p-4 text-[11px] font-extrabold text-[#FFD41C] uppercase border-b-2 border-[rgba(255,212,28,0.3)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((log, index) => {
                  const actor = log.adminName || log.driverName || log.userId || 'System';
                  const actorType = log.adminName ? '👨‍💼 Admin' : log.driverName ? '👨‍✈️ Driver' : log.userId ? '🎓 User' : '🤖 System';

                  return (
                    <tr key={log._id || index} className="border-b border-[rgba(255,212,28,0.1)]">
                      <td className="p-4 text-[rgba(251,251,251,0.7)] text-xs">
                        <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div className="text-[11px] text-[rgba(251,251,251,0.5)]">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-[rgba(251,251,251,0.9)] font-semibold text-sm">{actor}</div>
                        <div className="text-[11px] text-[rgba(251,251,251,0.5)]">{actorType}</div>
                      </td>
                      <td className="p-4 text-[rgba(251,251,251,0.9)] font-semibold">
                        <div className="mb-1">{log.title || 'N/A'}</div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase
                          ${log.eventType === 'admin_action' ? 'bg-[rgba(59,130,246,0.2)] text-[#3B82F6]' :
                            log.eventType === 'login' ? 'bg-[rgba(34,197,94,0.2)] text-[#22C55E]' :
                            'bg-[rgba(168,85,247,0.2)] text-[#A855F7]'}`}>
                          {log.eventType || log.type}
                        </span>
                      </td>
                      <td className="p-4 text-[rgba(251,251,251,0.7)] max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {log.description || log.message || '-'}
                      </td>
                      <td className="p-4 text-[rgba(251,251,251,0.6)] text-xs">
                        {log.ipAddress ? (
                          <div className="flex items-center gap-1">
                            <span>📍</span>
                            <span>{log.ipAddress}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase
                          ${log.severity === 'warning' ? 'bg-[rgba(251,191,36,0.2)] text-[#FBBF24]' :
                            log.severity === 'error' ? 'bg-[rgba(239,68,68,0.2)] text-[#EF4444]' :
                            'bg-[rgba(34,197,94,0.2)] text-[#22C55E]'}`}>
                          {log.severity || 'info'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => setSelectedLog(log)}
                          className="px-3.5 py-1.5 bg-[rgba(255,212,28,0.15)] border-2 border-[rgba(255,212,28,0.3)] rounded-lg text-[#FFD41C] text-[11px] font-semibold cursor-pointer hover:bg-[rgba(255,212,28,0.25)] transition-colors">
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center p-5 bg-[rgba(255,255,255,0.05)] rounded-xl border border-[rgba(255,212,28,0.2)]">
              <div className="text-[13px] text-[rgba(251,251,251,0.6)]">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 border-2 border-[rgba(255,212,28,0.3)] rounded-lg text-xs font-semibold transition-colors
                    ${currentPage === 1
                      ? 'bg-[rgba(255,255,255,0.05)] text-[rgba(251,251,251,0.3)] cursor-not-allowed'
                      : 'bg-[rgba(255,212,28,0.15)] text-[#FFD41C] cursor-pointer hover:bg-[rgba(255,212,28,0.25)]'}`}>
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 border-2 border-[rgba(255,212,28,0.3)] rounded-lg text-xs font-semibold transition-colors
                    ${currentPage === totalPages
                      ? 'bg-[rgba(255,255,255,0.05)] text-[rgba(251,251,251,0.3)] cursor-not-allowed'
                      : 'bg-[rgba(255,212,28,0.15)] text-[#FFD41C] cursor-pointer hover:bg-[rgba(255,212,28,0.25)]'}`}>
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
      </div>

      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
