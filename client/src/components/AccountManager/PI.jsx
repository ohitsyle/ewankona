// client/src/components/AccountManager/PI.jsx
import React from "react";

export default function PI({ userData }) {
  const getInitials = () => {
    if (!userData?.firstName || !userData?.lastName) return '?';
    return (userData.firstName[0] + userData.lastName[0]).toUpperCase();
  };

  const fullName = userData?.firstName && userData?.lastName 
    ? `${userData.firstName} ${userData.middleName ? userData.middleName + ' ' : ''}${userData.lastName}`
    : 'N/A';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '16px',
      border: '1px solid rgba(255,212,28,0.2)',
      overflow: 'hidden'
    }}>
      {/* Profile Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,212,28,0.2) 0%, rgba(255,212,28,0.05) 100%)',
        padding: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        borderBottom: '1px solid rgba(255,212,28,0.2)'
      }}>
        {/* Avatar */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFD41C 0%, #F59E0B 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          fontWeight: 800,
          color: '#181D40',
          boxShadow: '0 0 0 6px rgba(255,212,28,0.2)'
        }}>
          {getInitials()}
        </div>

        {/* Name and Role */}
        <div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#FBFBFB',
            margin: '0 0 8px 0'
          }}>
            {fullName}
          </h2>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: 'rgba(255,212,28,0.2)',
            border: '1px solid rgba(255,212,28,0.4)',
            borderRadius: '20px',
            color: '#FFD41C',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {userData?.role || 'N/A'}
          </div>
        </div>
      </div>

      {/* Personal Info Grid */}
      <div style={{ padding: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px'
        }}>
          <InfoField label="Email Address" value={userData?.email} />
          <InfoField label="School ID" value={userData?.schoolUId} />
          
          <InfoField 
            label="Account Status" 
            value={userData?.isActive ? 'Active' : 'Inactive'}
            highlight={userData?.isActive ? 'success' : 'error'}
          />
          <InfoField 
            label="Verified" 
            value={userData?.isVerified ? 'Yes' : 'No'}
            highlight={userData?.isVerified ? 'success' : 'warning'}
          />
          
          {userData?.isDeactivated && (
            <InfoField 
              label="Deactivation Status" 
              value="Deactivated"
              highlight="error"
            />
          )}
          
          {userData?.deactivatedAt && (
            <InfoField 
              label="Deactivated At" 
              value={new Date(userData.deactivatedAt).toLocaleString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} 
            />
          )}
          
          {userData?.createdAt && (
            <InfoField 
              label="Account Created" 
              value={new Date(userData.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} 
            />
          )}
          
          {userData?.updatedAt && (
            <InfoField 
              label="Last Updated" 
              value={new Date(userData.updatedAt).toLocaleString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Info Field Component
function InfoField({ label, value, highlight, fullWidth }) {
  const getHighlightColor = () => {
    if (highlight === 'success') return { 
      bg: 'rgba(34, 197, 94, 0.15)', 
      border: 'rgba(34, 197, 94, 0.3)', 
      color: '#22C55E' 
    };
    if (highlight === 'error') return { 
      bg: 'rgba(239, 68, 68, 0.15)', 
      border: 'rgba(239, 68, 68, 0.3)', 
      color: '#EF4444' 
    };
    if (highlight === 'warning') return { 
      bg: 'rgba(245, 158, 11, 0.15)', 
      border: 'rgba(245, 158, 11, 0.3)', 
      color: '#F59E0B' 
    };
    return null;
  };

  const highlightStyle = getHighlightColor();

  return (
    <div style={{
      gridColumn: fullWidth ? '1 / -1' : 'span 1'
    }}>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: '11px',
        fontWeight: 700,
        color: 'rgba(255,212,28,0.8)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </label>
      <div style={{
        padding: '12px 16px',
        background: highlightStyle ? highlightStyle.bg : 'rgba(251,251,251,0.05)',
        border: `1px solid ${highlightStyle ? highlightStyle.border : 'rgba(255,212,28,0.1)'}`,
        borderRadius: '8px',
        color: highlightStyle ? highlightStyle.color : 'rgba(251,251,251,0.9)',
        fontSize: '15px',
        fontWeight: highlight ? 700 : 500
      }}>
        {value || 'N/A'}
      </div>
    </div>
  );
}