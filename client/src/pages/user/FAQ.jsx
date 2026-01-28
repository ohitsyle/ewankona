import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function FAQ() {
  const { theme, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'What is NUCash?',
      answer: 'NUCash is a digital wallet system designed for National University students and employees to facilitate cashless transactions within the campus.'
    },
    {
      question: 'How do I check my balance?',
      answer: 'Your balance is displayed on the main dashboard. Click the eye icon to toggle between showing and hiding your balance.'
    },
    {
      question: 'How do I report a concern?',
      answer: 'Click on the "Report a Concern" button on the dashboard, select the department you want to report to, choose the type of concern, and provide details.'
    },
    {
      question: 'How do I change my PIN?',
      answer: 'Go to Settings > Security and click "Change PIN". You\'ll need to enter your current PIN before setting a new one.'
    },
    {
      question: 'What should I do if I forget my PIN?',
      answer: 'On the login screen, click "Forgot PIN" and follow the instructions to reset it using your registered email.'
    },
    {
      question: 'How can I view my transaction history?',
      answer: 'Navigate to the History tab to see all your past transactions, including the date, amount, and transaction type.'
    },
    {
      question: 'Who can I contact for support?',
      answer: 'You can submit feedback or report a concern through the dashboard, or contact the Treasury Office directly for account-related issues.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-5" style={{ borderBottom: `2px solid ${theme.border.primary}` }}>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: theme.accent.primary,
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>❓</span> Frequently Asked Questions
          </h2>
          <p style={{ fontSize: '13px', color: theme.text.secondary, margin: 0 }}>
            Find answers to common questions about NUCash
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              style={{
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.05)',
                borderRadius: '12px',
                border: `1px solid ${theme.border.primary}`,
                overflow: 'hidden'
              }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                style={{
                  background: openIndex === index
                    ? (isDarkMode ? 'rgba(255, 212, 28, 0.1)' : 'rgba(59, 130, 246, 0.1)')
                    : 'transparent',
                  width: '100%',
                  padding: '16px 20px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (openIndex !== index) {
                    e.currentTarget.style.background = isDarkMode
                      ? 'rgba(255, 212, 28, 0.05)'
                      : 'rgba(59, 130, 246, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (openIndex !== index) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span
                  style={{
                    color: theme.text.primary,
                    fontSize: '15px',
                    fontWeight: 600
                  }}
                >
                  {faq.question}
                </span>
                <svg
                  style={{
                    color: theme.accent.primary,
                    transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    flexShrink: 0,
                    marginLeft: '16px'
                  }}
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openIndex === index && (
                <div
                  style={{
                    background: isDarkMode ? 'rgba(255, 212, 28, 0.05)' : 'rgba(59, 130, 246, 0.05)',
                    borderTop: `1px solid ${theme.border.primary}`,
                    padding: '16px 20px',
                    animation: 'fadeIn 0.3s ease-out'
                  }}
                >
                  <p
                    style={{
                      color: theme.text.secondary,
                      fontSize: '14px',
                      lineHeight: '1.6',
                      margin: 0
                    }}
                  >
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support Card */}
        <div
          style={{
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.05)',
            borderRadius: '16px',
            border: `1px solid ${theme.border.primary}`,
            padding: '32px',
            marginTop: '32px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <h3
            style={{
              color: theme.accent.primary,
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '8px'
            }}
          >
            Still have questions?
          </h3>
          <p
            style={{
              color: theme.text.secondary,
              fontSize: '14px',
              marginBottom: '24px'
            }}
          >
            Contact our support team for additional assistance
          </p>
          <button
            style={{
              background: theme.accent.primary,
              color: theme.accent.secondary,
              padding: '12px 32px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => navigate('/user/dashboard')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Report a Concern
          </button>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
    </div>
  );
}
