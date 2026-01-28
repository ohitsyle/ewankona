// client/src/pages/admin/Treasury/MerchantsPage.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { getMerchants } from '../../../services/treasuryApi';
import { toast } from 'react-toastify';
import SearchBar from '../../../components/shared/SearchBar';

export default function MerchantsPage() {
  const { theme, isDarkMode } = useTheme();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const loadMerchants = async () => {
    try {
      const response = await getMerchants({
        search: searchQuery
      });

      if (response.success) {
        setMerchants(response.merchants || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading merchants:', error);
      toast.error('Failed to load merchants');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMerchants();
    const interval = setInterval(loadMerchants, 30000);
    return () => clearInterval(interval);
  }, [searchQuery]);

  const filteredMerchants = merchants
    .filter(m =>
      m.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.merchantId?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by isActive status (active first)
      if (a.isActive !== b.isActive) {
        return b.isActive ? 1 : -1;
      }
      // Then sort by businessName
      return (a.businessName || '').localeCompare(b.businessName || '');
    });

  // Pagination
  const totalPages = Math.ceil(filteredMerchants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredMerchants.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: theme.accent.primary
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `4px solid ${isDarkMode ? 'rgba(255, 212, 28, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
          borderTopColor: theme.accent.primary,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%' }}>
      <div className="h-full flex flex-col">
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 700,
                color: theme.text.primary,
                margin: '0 0 8px 0'
              }}>
                Merchant Accounts
              </h2>
              <p style={{
                fontSize: '14px',
                color: theme.text.secondary,
                margin: 0
              }}>
                {filteredMerchants.length} merchant{filteredMerchants.length !== 1 ? 's' : ''} registered (Page {currentPage} of {totalPages || 1})
              </p>
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '20px' }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search merchants by name, contact, email, or ID..."
            />
          </div>

          {/* Merchant Cards Grid - Scrollable Area */}
          <div className="flex-1 overflow-y-auto pr-2">
            {filteredMerchants.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '20px'
              }}>
                {currentItems.map((merchant) => (
                  <MerchantCard
                    key={merchant._id}
                    merchant={merchant}
                    theme={theme}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                background: theme.bg.card,
                borderRadius: '16px',
                border: `2px solid ${isDarkMode ? 'rgba(255, 212, 28, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                padding: '60px',
                textAlign: 'center',
                color: theme.text.secondary
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏪</div>
                <p style={{ margin: 0, fontSize: '16px' }}>
                  {searchQuery ? 'No merchants found matching your search' : 'No merchants yet'}
                </p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}`
              }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '10px 20px',
                    background: currentPage === 1
                      ? (isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)')
                      : (isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'),
                    border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                    borderRadius: '8px',
                    color: currentPage === 1
                      ? (isDarkMode ? 'rgba(255,212,28,0.5)' : 'rgba(59,130,246,0.5)')
                      : theme.accent.primary,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ← Previous
                </button>
                <span style={{
                  color: theme.text.primary,
                  fontSize: '14px',
                  fontWeight: 600,
                  minWidth: '120px',
                  textAlign: 'center'
                }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '10px 20px',
                    background: currentPage === totalPages
                      ? (isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)')
                      : (isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'),
                    border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
                    borderRadius: '8px',
                    color: currentPage === totalPages
                      ? (isDarkMode ? 'rgba(255,212,28,0.5)' : 'rgba(59,130,246,0.5)')
                      : theme.accent.primary,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
          }
          50% {
            opacity: 0.7;
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.1);
          }
        }
      `}</style>
    </div>
  );
}

function MerchantCard({ merchant, theme, isDarkMode }) {
  const isActive = merchant.isActive !== false;

  return (
    <div style={{
      background: theme.bg.card,
      borderRadius: '16px',
      border: `2px solid ${isDarkMode ? 'rgba(255, 212, 28, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
      padding: '24px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer',
      opacity: isActive ? 1 : 0.7
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = `0 8px 24px ${isDarkMode ? 'rgba(255, 212, 28, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      {/* Header with ID Badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div style={{
          padding: '6px 14px',
          background: isDarkMode ? 'rgba(255, 212, 28, 0.15)' : 'rgba(59, 130, 246, 0.15)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 212, 28, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700,
          color: theme.accent.primary
        }}>
          {merchant.merchantId || 'N/A'}
        </div>
        <div style={{
          width: '12px',
          height: '12px',
          background: isActive ? '#10B981' : '#EF4444',
          borderRadius: '50%',
          boxShadow: `0 0 0 3px ${isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          animation: isActive ? 'pulse 2s ease-in-out infinite' : 'none'
        }} />
      </div>

      {/* Business Name */}
      <h3 style={{
        fontSize: '20px',
        fontWeight: 700,
        color: theme.text.primary,
        margin: '0 0 8px 0'
      }}>
        {merchant.businessName}
      </h3>

      {/* Contact Info */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{
          fontSize: '13px',
          color: theme.text.secondary,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>👤</span>
          <span>{merchant.firstName} {merchant.lastName}</span>
        </div>
        <div style={{
          fontSize: '13px',
          color: theme.text.secondary,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📧</span>
          <span>{merchant.email}</span>
        </div>
        {merchant.balance !== undefined && (
          <div style={{
            fontSize: '13px',
            color: theme.text.secondary,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>💰</span>
            <span style={{ fontWeight: 600, color: theme.text.primary }}>
              ₱{Number(merchant.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
