import React, { useEffect } from "react";

export default function LogDetailModal({ log, onClose }) {
  if (!log) return null;

  // ✅ Extract admin info from metadata if it exists
  const adminName = log.adminName || log.metadata?.adminName;
  const adminEmail = log.adminEmail || log.metadata?.adminEmail;
  const adminSchoolUId = log.metadata?.adminSchoolUId;

  const LOG_TYPE_OPTIONS = [
  { label: "All Logs", value: "all" },
  { label: "💸 Credit", value: "transaction" },
  { label: "🧾 Debit", value: "cashout" },
  { label: "👤 Registrations", value: "registration" },
  { label: "🔑 Access Control", value: "access" },
];

const logTypeLabel =
  LOG_TYPE_OPTIONS.find(opt => opt.value === log.logType)?.label || log.logType || "N/A";

  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
      case "pending-200":
        return { bg: "bg-yellow-100", text: "text-yellow-400" };
      case "success":
      case "success-200":
      case "released":
      case "active":
      case "login":
        return { bg: "bg-green-100", text: "text-green-500" };
      case "error":
      case "failed":
      case "error-401":
      case "cancelled":
      case "failed login (3x)":
        return { bg: "bg-red-100", text: "text-red-500" };
      case "disabled":
      case "logout":
      default:
        return { bg: "bg-gray-200", text: "text-gray-500" };
    }
  };

  const statusStyle = getStatusColor(log.status || log.statusCode || log.action);

  // Fields to exclude from display
  const excludedFields = [
    'metadata', 
    'user', 
    'updatedAt', 
    '_id', 
    'status',
    'schoolUId',
    'eventType',
    '__v',
    'timestamp', // Usually duplicate of createdAt
    'location',
    'userId'
  ];

  // Fields with custom display names
  const fieldLabels = {
    eventId: 'Event ID',
    eventType: 'Event Type',
    title: 'Title',
    description: 'Description',
    severity: 'Severity',
    userId: 'User ID',
    driverId: 'Driver ID',
    shuttleId: 'Shuttle ID',
    routeId: 'Route ID',
    tripId: 'Trip ID',
    transactionId: 'Transaction ID',
    // invoiceNo: 'Invoice Number',
    ipAddress: 'IP Address',
    location: 'Location',
    status: 'Status',
    createdAt: 'Date & Time',
    logType: 'Log Type',
    type: 'Type'
  };

  // Format values for better display
  const formatValue = (key, value) => {
    if (value === null || value === undefined) return 'N/A';
    
    // Format dates
    if (key === 'createdAt' && value) {
      const date = new Date(value);
      return `${date.toLocaleDateString('en-GB')} at ${date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    }
    
    // Format location
    if (key === 'location' && typeof value === 'object') {
      if (value.latitude && value.longitude) {
        return `${value.latitude}, ${value.longitude}`;
      }
      return 'N/A';
    }
    
    // Format objects
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  };

  // Filter and sort log entries
  const filteredLogEntries = Object.entries(log)
    .filter(([key]) => !excludedFields.includes(key))
    .filter(([key, value]) => value !== null && value !== undefined && value !== '')
    .sort(([keyA], [keyB]) => {
      // Custom sort order: important fields first
      const order = ['eventId', 'eventType', 'title', 'description', 'severity', 'status', 'createdAt'];
      const indexA = order.indexOf(keyA);
      const indexB = order.indexOf(keyB);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-[#1E2347] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeInScale shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-yellow-50/10 border-b-2 border-yellow-400 flex justify-between items-center px-6 py-2 z-10 backdrop-blur-md">
          <h3 className="text-yellow-400 font-extrabold text-s uppercase tracking-wide">
            Log Details
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

          {/* Log Information Card */}
          <div className="p-5 rounded-xl bg-[#2A2F5D]">
            <h4 className="text-[13px] text-yellow-400 uppercase font-bold tracking-wide mb-4">
              Log Information
            </h4>
            <div className="space-y-3">
              {filteredLogEntries.map(([key, value]) => {
                const formattedValue = formatValue(key, value);
                const label = fieldLabels[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
                
                return (
                  <div key={key}>
                    <label className="block text-[11px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                      {label}
                    </label>
                    <p className={`text-[13px] text-white break-all bg-black/20 p-2 rounded-md ${
                      typeof value === 'object' ? 'font-mono' : 'font-semibold'
                    }`}>
                      {formattedValue}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admin Information Card - Shows only if admin data exists */}
          {adminName && (
            <div className="p-5 rounded-xl bg-[#2A2F5D]">
              <h4 className="text-[13px] text-yellow-400 uppercase font-bold tracking-wide mb-4">
                Processed By
              </h4>
              <div>
                <p className="text-base font-semibold text-white">{adminName}</p>
              </div>
            </div>
          )}
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