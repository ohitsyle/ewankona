import React from "react";

export default function LogsTable({
  data = [],
  columns = [],
  onRowClick,
  showHeader = true,
  title = "Logs",
  loading = false,
}) {
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format severity badge
  const formatSeverity = (severity) => {
    if (!severity) return <span className="text-white/50">N/A</span>;
    
    const colors = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      info: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[severity.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
        {severity}
      </span>
    );
  };

  // Format event type badge
  const formatEventType = (eventType) => {
    if (!eventType) return <span className="text-white/50">N/A</span>;
    
    const colors = {
      login: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      logout: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      registration: 'bg-green-500/20 text-green-400 border-green-500/30',
      payment: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      cashin: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      cashout: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      // invoice: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      security: 'bg-red-500/20 text-red-400 border-red-500/30',
      admin_action: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      user_action: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[eventType] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
        {eventType}
      </span>
    );
  };

  const extractTransactionId = (row) => {
    // Try direct property first
    if (row.transactionId) return row.transactionId;
    
    // Try metadata
    if (row.metadata?.transactionId) return row.metadata.transactionId;
    
    // Try paymentInfo
    if (row.paymentInfo?.transactionId) return row.paymentInfo.transactionId;
    
    // Try transactionInfo
    if (row.transactionInfo?.transactionId) return row.transactionInfo.transactionId;
    
    return null;
  };

  const extractSchoolUId = (row) => {
    // Try direct property first
    if (row.schoolUId) return row.schoolUId;
    
    // Try metadata (most common location)
    if (row.metadata?.schoolUId) return row.metadata.schoolUId;
    
    // Try userId object (for cash-in and transaction logs)
    if (row.userId?.schoolUId) return row.userId.schoolUId;
    
    // Try user object
    if (row.user?.schoolUId) return row.user.schoolUId;
    
    // Try accessInfo
    if (row.accessInfo?.schoolUId) return row.accessInfo.schoolUId;
    
    // Try paymentInfo (for cash-in/payment logs)
    if (row.paymentInfo?.schoolUId) return row.paymentInfo.schoolUId;
    
    // Try transactionInfo
    if (row.transactionInfo?.schoolUId) return row.transactionInfo.schoolUId;
    
    // Try cashoutInfo
    if (row.cashoutInfo?.schoolUId) return row.cashoutInfo.schoolUId;
    
    // Try invoiceInfo
    // if (row.invoiceInfo?.schoolUId) return row.invoiceInfo.schoolUId;
    
    return null;
  };

  // Smart formatter based on column key
  const formatCellValue = (value, key, row) => {
    // Special handling for transactionId
    if (key === 'transactionId') {
      const transactionId = extractTransactionId(row);
      if (transactionId) {
        return <span className="font-mono text-xs text-white/90">{transactionId}</span>;
      }
      return <span className="text-white/40">N/A</span>;
    }

    // Special handling for schoolUId
    if (key === 'schoolUId') {
      const schoolId = extractSchoolUId(row);
      if (schoolId) {
        return <span className="font-mono text-xs text-white/90">{schoolId}</span>;
      }
      return <span className="text-white/40">N/A</span>;
    }

    if (value === null || value === undefined || value === '') {
      return <span className="text-white/40">N/A</span>;
    }

    switch (key) {
      case 'timestamp':
      case 'createdAt':
        return <span className="text-white">{formatTimestamp(value)}</span>;
      
      case 'severity':
        return formatSeverity(value);
      
      case 'eventType':
        return formatEventType(value);
      
      case 'ipAddress':
        return <span className="font-mono text-xs text-white/80">{value}</span>;
      
      case 'userId':
      case 'eventId':
      // case 'invoiceNo':
        return <span className="font-mono text-xs text-white/90">{value}</span>;
      
      case 'accessInfo':
        // Display access info metadata
        if (typeof value === 'object' && value !== null) {
          return (
            <div className="text-xs text-white/80">
              {value.ipAddress && <div>IP: {value.ipAddress}</div>}
              {value.accountType && <div>Type: {value.accountType}</div>}
              {value.email && <div className="truncate max-w-[150px]">{value.email}</div>}
            </div>
          );
        }
        return <span className="text-white/80">{String(value)}</span>;
      
      default:
        return <span className="text-white/90">{String(value)}</span>;
    }
  };

  if (loading) {
    return (
      <div className={`flex flex-col w-full max-w-full ${showHeader ? "h-[300px]" : "h-[420px]"}`}>
        <div className={`flex flex-col items-center justify-center flex-1 text-center text-white/50 border border-yellow-400/20 ${
          showHeader ? "" : ""
        } p-16`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mb-4"></div>
          <div>Loading {title.toLowerCase()}...</div>
        </div>
      </div>
    );
  }

  // ✅ Debug: Log first few rows to see data structure
  if (data.length > 0) {
    console.log('📊 Sample log data:', data.slice(0, 2));
  }

  return (
    <div className={`flex flex-col w-full max-w-full ${showHeader ? "h-[300px]" : "h-[420px]"}`}>

      {/* Table Container */}
      {data.length === 0 ? (
        <div
          className={`flex flex-col items-center justify-center flex-1 text-center text-white/50 border border-yellow-400/20 ${
            showHeader ? "" : ""
          } p-16`}
        >
          <div className="text-4xl mb-4">📋</div>
          <div>No {title.toLowerCase()} found</div>
          <div className="text-xs text-white/40 mt-2">Try adjusting your filters</div>
        </div>
      ) : (
        <div
          className={`flex-1 overflow-auto border border-yellow-400/20 ${
            showHeader ? "" : ""
          }`}
        >
          <table className="w-full border-collapse text-[13px] relative">
            {/* Table Header - Fixed sticky with gradient fade effect */}
            <thead className="sticky top-0 z-10 shadow-[0_2px_0_0_rgba(250,204,21,0.3)]">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key || col.label}
                    className="text-center text-[11px] font-extrabold text-[#FFD41C] uppercase py-2 px-5 backdrop-blur-sm bg-yellow-400/10 whitespace-nowrap"
                    style={{ 
                      backgroundColor: 'rgba(250, 204, 21, 0.1)',
                      width: col.width || 'auto',
                      minWidth: col.width || 'auto'
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={row._id || row.id || row.logId || row.eventId || idx}
                  onClick={() => onRowClick?.(row)}
                  className="border-b border-yellow-400/10 cursor-pointer hover:bg-yellow-400/5 transition"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key || col.label}
                      className={`py-3 px-5 text-center whitespace-nowrap overflow-hidden text-ellipsis ${col.bold ? "font-bold" : ""}`}
                      style={{ 
                        width: col.width || 'auto',
                        minWidth: col.width || 'auto',
                        maxWidth: col.width === 'auto' ? 'none' : col.width
                      }}
                    >
                      {col.format 
                        ? col.format(row[col.key], row) 
                        : formatCellValue(row[col.key], col.key, row)
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}