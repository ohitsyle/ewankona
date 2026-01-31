// src/pages/user/FAQ.jsx
// FAQ page with NUCash styling

import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ChevronDown, Search, HelpCircle, CreditCard, Wallet, Shield, Smartphone, Users } from 'lucide-react';

export default function FAQ() {
  const { theme, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState({});

  const categories = [
    { id: 'all', label: 'All FAQs', icon: '📋' },
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'balance', label: 'Balance & Cash-In', icon: '💰' },
    { id: 'transactions', label: 'Transactions', icon: '📊' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'technical', label: 'Technical', icon: '🔧' }
  ];

  const faqs = [
    // Account FAQs
    {
      id: 1,
      category: 'account',
      question: 'How do I activate my NUCash account?',
      answer: 'To activate your NUCash account, visit the Treasury Office with your valid school ID. They will verify your identity and activate your account on the spot. You will receive a confirmation via your registered email.'
    },
    {
      id: 2,
      category: 'account',
      question: 'What should I do if I forgot my PIN?',
      answer: 'If you forgot your PIN, go to Manage Profile > Security tab and click "Change PIN". You will need to verify your identity through your registered email. Alternatively, visit the Treasury Office for in-person assistance.'
    },
    {
      id: 3,
      category: 'account',
      question: 'Can I have multiple NUCash accounts?',
      answer: 'No, each student or employee is only allowed one NUCash account tied to their official school ID. This ensures security and proper tracking of transactions.'
    },
    {
      id: 4,
      category: 'account',
      question: 'How do I update my personal information?',
      answer: 'You can update some personal information through Manage Profile. However, changes to your name, email, or student ID must be done through the Registrar\'s Office, and the changes will reflect in NUCash within 24-48 hours.'
    },

    // Balance & Cash-In FAQs
    {
      id: 5,
      category: 'balance',
      question: 'How do I add money to my NUCash account?',
      answer: 'You can add money (cash-in) at any Treasury Office window during operating hours. Simply present your school ID and the amount you wish to load. The balance will be updated instantly.'
    },
    {
      id: 6,
      category: 'balance',
      question: 'What is the minimum and maximum cash-in amount?',
      answer: 'The minimum cash-in amount is ₱50.00. The maximum single cash-in is ₱10,000.00. Your total account balance cannot exceed ₱50,000.00.'
    },
    {
      id: 7,
      category: 'balance',
      question: 'Can I transfer my NUCash balance to another account?',
      answer: 'Currently, peer-to-peer transfers are not available. You can only use your NUCash balance for purchases at registered merchants and shuttle services within the campus.'
    },
    {
      id: 8,
      category: 'balance',
      question: 'How do I check my current balance?',
      answer: 'Your balance is displayed on the Home tab of your NUCash dashboard. For security, it\'s hidden by default—click the eye icon to reveal your balance. You can also check at any payment terminal.'
    },

    // Transaction FAQs
    {
      id: 9,
      category: 'transactions',
      question: 'How can I view my transaction history?',
      answer: 'Go to the History tab to view all your transactions. You can filter by date range (Today, Week, Month) and export your transaction history for your records.'
    },
    {
      id: 10,
      category: 'transactions',
      question: 'What should I do if a transaction is incorrect?',
      answer: 'If you notice an incorrect transaction, report it immediately through the "Report a Concern" button on your dashboard. Select "Finance" as the department and provide transaction details. Our team will investigate within 24-48 hours.'
    },
    {
      id: 11,
      category: 'transactions',
      question: 'Can I cancel or refund a transaction?',
      answer: 'Transactions are final and cannot be cancelled once completed. For disputes, please file a concern through the app or visit the Treasury Office. Refunds are evaluated on a case-by-case basis.'
    },
    {
      id: 12,
      category: 'transactions',
      question: 'Why doesn\'t my transaction appear in my history?',
      answer: 'Transactions typically appear instantly. If it\'s missing, wait a few minutes and refresh the page. If it still doesn\'t appear after 30 minutes, report the issue immediately with any receipt or reference number you may have.'
    },

    // Security FAQs
    {
      id: 13,
      category: 'security',
      question: 'How do I keep my NUCash account secure?',
      answer: 'Never share your PIN with anyone. Always log out after using shared devices. Enable notifications to monitor your account activity. Report any suspicious activity immediately.'
    },
    {
      id: 14,
      category: 'security',
      question: 'What should I do if I suspect unauthorized access?',
      answer: 'If you suspect unauthorized access, immediately change your PIN through Manage Profile. Then report the incident to the Treasury Office and file a concern in the app. We will investigate and secure your account.'
    },
    {
      id: 15,
      category: 'security',
      question: 'How do I change my PIN?',
      answer: 'Go to Manage Profile > Security tab > Change PIN. Enter your current PIN, then your new 6-digit PIN twice. For security, choose a PIN that\'s not easily guessable (avoid birthdays, sequential numbers).'
    },
    {
      id: 16,
      category: 'security',
      question: 'What happens if I enter the wrong PIN multiple times?',
      answer: 'After 5 consecutive incorrect PIN attempts, your account will be temporarily locked for 30 minutes. If you\'ve forgotten your PIN, visit the Treasury Office for assistance.'
    },

    // Technical FAQs
    {
      id: 17,
      category: 'technical',
      question: 'Why is the app not loading properly?',
      answer: 'Try clearing your browser cache and refreshing the page. Make sure you\'re using a supported browser (Chrome, Firefox, Safari, Edge). If issues persist, try accessing from a different device or network.'
    },
    {
      id: 18,
      category: 'technical',
      question: 'What browsers are supported?',
      answer: 'NUCash works best on the latest versions of Google Chrome, Mozilla Firefox, Safari, and Microsoft Edge. For optimal experience, keep your browser updated.'
    },
    {
      id: 19,
      category: 'technical',
      question: 'Is there a mobile app for NUCash?',
      answer: 'Currently, NUCash is a web application accessible through any mobile browser. A dedicated mobile app is planned for future release. Bookmark the website for quick access on your phone.'
    },
    {
      id: 20,
      category: 'technical',
      question: 'Who do I contact for technical support?',
      answer: 'For technical issues, use the "Report a Concern" feature and select "NUCash System". For urgent matters, visit the IT Service Office (ITSO) or email support@nu.edu.ph.'
    }
  ];

  const toggleItem = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return faqs.length;
    return faqs.filter(f => f.category === categoryId).length;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        style={{
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}`
        }}
      >
        <div className="flex items-center gap-4 mb-3">
          <div
            style={{
              background: isDarkMode ? 'rgba(255,212,28,0.15)' : 'rgba(59,130,246,0.15)',
              border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`
            }}
            className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
          >
            ❓
          </div>
          <div>
            <h2 style={{ color: theme.accent.primary }} className="text-2xl font-bold m-0">
              Frequently Asked Questions
            </h2>
            <p style={{ color: theme.text.secondary }} className="text-sm m-0 mt-1">
              Find answers to common questions about NUCash
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4">
          <Search
            style={{ color: theme.text.tertiary }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
          />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}`,
              borderRadius: '12px',
              color: theme.text.primary,
              fontSize: '15px',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.accent.primary;
              e.target.style.boxShadow = `0 0 0 3px ${isDarkMode ? 'rgba(255,212,28,0.1)' : 'rgba(59,130,246,0.1)'}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              background: activeCategory === cat.id
                ? theme.accent.primary
                : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
              color: activeCategory === cat.id
                ? (isDarkMode ? '#181D40' : '#FFFFFF')
                : theme.text.secondary,
              border: `2px solid ${activeCategory === cat.id
                ? theme.accent.primary
                : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`
            }}
            className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all hover:scale-105"
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span
              style={{
                background: activeCategory === cat.id
                  ? (isDarkMode ? 'rgba(24,29,64,0.3)' : 'rgba(255,255,255,0.3)')
                  : (isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'),
                color: activeCategory === cat.id
                  ? (isDarkMode ? '#181D40' : '#FFFFFF')
                  : theme.accent.primary
              }}
              className="px-2 py-0.5 rounded-full text-xs font-bold"
            >
              {getCategoryCount(cat.id)}
            </span>
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16">
            <div
              style={{
                background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                border: `2px dashed ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
              }}
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl opacity-50"
            >
              🔍
            </div>
            <p style={{ color: theme.text.secondary }} className="text-lg font-semibold">No FAQs found</p>
            <p style={{ color: theme.text.tertiary }} className="text-sm mt-1">
              Try a different search term or category
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              style={{
                background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                border: `2px solid ${expandedItems[faq.id]
                  ? theme.accent.primary
                  : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')}`
              }}
              className="rounded-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleItem(faq.id)}
                className="w-full p-5 flex items-center justify-between text-left transition-all"
                style={{
                  background: expandedItems[faq.id]
                    ? (isDarkMode ? 'rgba(255,212,28,0.05)' : 'rgba(59,130,246,0.03)')
                    : 'transparent'
                }}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    style={{
                      background: isDarkMode ? 'rgba(255,212,28,0.15)' : 'rgba(59,130,246,0.1)',
                      color: theme.accent.primary
                    }}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  >
                    {categories.find(c => c.id === faq.category)?.icon || '❓'}
                  </div>
                  <span style={{ color: theme.text.primary }} className="font-semibold text-[15px]">
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  style={{
                    color: theme.accent.primary,
                    transform: expandedItems[faq.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}
                  className="w-5 h-5 flex-shrink-0 ml-4"
                />
              </button>

              {expandedItems[faq.id] && (
                <div
                  style={{
                    borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`
                  }}
                  className="px-5 py-4"
                >
                  <p
                    style={{ color: theme.text.secondary }}
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                  >
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Help Footer */}
      <div
        style={{
          marginTop: '24px',
          padding: '20px',
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(255,212,28,0.1) 0%, rgba(255,212,28,0.02) 100%)'
            : 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.02) 100%)',
          border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}`,
          borderRadius: '16px'
        }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div
            style={{
              background: isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.15)'
            }}
            className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
          >
            💬
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 style={{ color: theme.text.primary }} className="font-bold text-lg mb-1">
              Still have questions?
            </h4>
            <p style={{ color: theme.text.secondary }} className="text-sm">
              Can't find what you're looking for? Report a concern from your dashboard and our team will help you.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/user/dashboard'}
            style={{
              background: theme.accent.primary,
              color: isDarkMode ? '#181D40' : '#FFFFFF'
            }}
            className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 hover:scale-105 flex-shrink-0"
          >
            Get Help
          </button>
        </div>
      </div>
    </div>
  );
}
