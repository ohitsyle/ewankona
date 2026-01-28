// src/merchant/components/Layout/Footer.jsx
import React, { useState } from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <>
      <footer style={{
        background: '#181D40',
        color: 'rgba(251, 251, 251, 0.7)',
        padding: '24px 40px',
        textAlign: 'center',
        fontSize: '12px',
        borderTop: '2px solid #FFD41C',
        marginTop: 'auto',
      }}>
        <p style={{ margin: 0 }}>
          &copy; {currentYear} NUCash System | National University Laguna | {' '}
          <button
            onClick={() => setShowTermsModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFD41C',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '12px',
              padding: 0,
              fontWeight: 600
            }}
          >
            Terms and Conditions
          </button>
          {' '} | Privacy Policy
        </p>
      </footer>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div
          onClick={() => setShowTermsModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15,18,39,0.9)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1227 100%)',
              borderRadius: '16px',
              maxWidth: '900px',
              width: '90%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '2px solid rgba(255,212,28,0.3)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px 32px',
              borderBottom: '2px solid rgba(255, 212, 28, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 212, 28, 0.1)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#FFD41C',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span>📜</span>
                Terms & Conditions
              </h3>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'rgba(251,251,251,0.6)',
                  transition: 'color 0.2s',
                  padding: '4px 8px',
                  lineHeight: 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFD41C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(251,251,251,0.6)';
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              flex: 1,
              overflow: 'hidden',
              padding: '24px 32px'
            }}>
              <iframe
                src="/terms-and-conditions-admin.html"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'white'
                }}
                title="Terms and Conditions"
              />
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px 32px',
              borderTop: '2px solid rgba(255, 212, 28, 0.2)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{
                  padding: '10px 24px',
                  background: '#FFD41C',
                  color: '#0F1227',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(255,212,28,0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#FFC107';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,212,28,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFD41C';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,212,28,0.3)';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
