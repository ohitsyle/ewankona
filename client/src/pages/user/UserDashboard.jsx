// src/pages/user/UserDashboard.jsx
// User Dashboard with balance, transactions, and concern/feedback modals
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';
import { Eye, EyeOff, Download, Calendar, FileText, ChevronRight, X, ChevronLeft, Check } from 'lucide-react';

export default function UserDashboard() {
  const { theme, isDarkMode } = useTheme();
  const [userData, setUserData] = useState(null);
  const [balance, setBalance] = useState(0);
  const [showBalance, setShowBalance] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const intervalRef = useRef(null);

  // Modal states
  const [showConcernModal, setShowConcernModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // Fetch balance - this also returns user info including isActive
      const balanceData = await api.get('/user/balance');
      if (balanceData?.balance !== undefined) {
        setBalance(balanceData.balance);
      }
      // Update userData with fresh isActive status from API
      if (balanceData?.user || balanceData?.isActive !== undefined) {
        setUserData(prev => ({
          ...prev,
          isActive: balanceData.user?.isActive ?? balanceData.isActive ?? prev?.isActive
        }));
      }

      const txData = await api.get('/user/transactions?limit=100');
      if (txData?.transactions) {
        setAllTransactions(txData.transactions);
        filterTransactions(txData.transactions, filter);
      }
    } catch (error) {
      console.error('Failed to load data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const filterTransactions = (txList, period) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let filtered = txList;

    if (period === 'today') {
      filtered = txList.filter(tx => new Date(tx.createdAt || tx.date) >= startOfDay);
    } else if (period === 'week') {
      filtered = txList.filter(tx => new Date(tx.createdAt || tx.date) >= startOfWeek);
    } else if (period === 'month') {
      filtered = txList.filter(tx => new Date(tx.createdAt || tx.date) >= startOfMonth);
    }

    setTransactions(filtered);
  };

  useEffect(() => {
    const data = localStorage.getItem('userData');
    if (data && data !== 'undefined' && data !== 'null') {
      try {
        setUserData(JSON.parse(data));
      } catch (e) {
        console.error('Error parsing userData');
      }
    }

    fetchData();
    intervalRef.current = setInterval(() => fetchData(true), 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    filterTransactions(allTransactions, filter);
  }, [filter, allTransactions]);

  const handleExport = () => {
    const printWindow = window.open('', '_blank');
    const periodLabel = filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : 'This Month';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NUCash Transaction History</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #FFD41C; padding-bottom: 20px; }
          .header h1 { color: #181D40; margin: 0 0 10px 0; }
          .header p { color: #666; margin: 0; }
          .user-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .user-info p { margin: 5px 0; }
          .summary { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .summary-item { text-align: center; padding: 15px; background: #f9f9f9; border-radius: 8px; flex: 1; margin: 0 5px; }
          .summary-item .label { font-size: 12px; color: #666; }
          .summary-item .value { font-size: 24px; font-weight: bold; color: #181D40; }
          .summary-item .value.green { color: #10B981; }
          .summary-item .value.red { color: #EF4444; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
          th { background: #181D40; color: #FFD41C; font-size: 12px; text-transform: uppercase; }
          .credit { color: #10B981; font-weight: bold; }
          .debit { color: #EF4444; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NUCash Transaction History</h1>
          <p>Period: ${periodLabel} | Generated: ${new Date().toLocaleString()}</p>
        </div>
        <div class="user-info">
          <p><strong>Name:</strong> ${userData?.firstName || ''} ${userData?.lastName || ''}</p>
          <p><strong>School ID:</strong> ${userData?.schoolUId || 'N/A'}</p>
          <p><strong>Email:</strong> ${userData?.email || 'N/A'}</p>
        </div>
        <div class="summary">
          <div class="summary-item">
            <div class="label">Current Balance</div>
            <div class="value green">P${balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Cash-In</div>
            <div class="value green">+P${transactions.filter(t => t.transactionType === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Spent</div>
            <div class="value red">-P${transactions.filter(t => t.transactionType === 'debit').reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.length === 0 ? `
              <tr><td colspan="3" style="text-align: center; padding: 40px; color: #999;">No transactions found for this period</td></tr>
            ` : transactions.map(tx => `
              <tr>
                <td>${tx.date || new Date(tx.createdAt).toLocaleDateString()} ${tx.time || new Date(tx.createdAt).toLocaleTimeString()}</td>
                <td>${tx.transactionType === 'credit' ? 'Cash-In' : tx.description || 'Purchase'}</td>
                <td class="${tx.transactionType === 'credit' ? 'credit' : 'debit'}">
                  ${tx.transactionType === 'credit' ? '+' : '-'}P${Math.abs(tx.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>This is an official transaction record from NUCash.</p>
          <p>For concerns, please contact the Treasury Office.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  if (loading) {
    return (
      <div style={{ color: theme.accent.primary }} className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: `${theme.accent.primary} transparent transparent transparent` }} />
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-220px)] flex flex-col lg:flex-row gap-5">
      {/* Left Column - Balance + Actions */}
      <div className="w-full lg:w-[340px] flex flex-col gap-5 flex-shrink-0">

        {/* Balance Card */}
        <div
          style={{
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(255,212,28,0.08) 0%, rgba(24,29,64,1) 100%)'
              : 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(255,255,255,1) 100%)',
            borderColor: isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)',
            boxShadow: isDarkMode
              ? '0 8px 32px rgba(255,212,28,0.15)'
              : '0 8px 32px rgba(59,130,246,0.15)'
          }}
          className="p-6 rounded-2xl border-2 relative overflow-hidden"
        >
          {/* Decorative background pattern */}
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '120px',
              height: '120px',
              background: isDarkMode
                ? 'radial-gradient(circle, rgba(255,212,28,0.15) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }}
          />

          <div className="flex items-center justify-between mb-4">
            <div style={{ color: theme.accent.primary }} className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: userData?.isActive !== false ? '#10B981' : '#EF4444',
                  boxShadow: userData?.isActive !== false ? '0 0 8px rgba(16,185,129,0.6)' : '0 0 8px rgba(239,68,68,0.6)'
                }}
              />
              NUCash Balance
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              style={{
                color: theme.text.secondary,
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`
              }}
              className="p-2.5 rounded-xl hover:opacity-80 transition"
            >
              {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative z-10">
            <div
              style={{
                color: showBalance ? '#10B981' : theme.text.tertiary,
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
              className="text-4xl font-extrabold mb-4 tracking-tight"
            >
              {showBalance
                ? `₱${balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                : '₱ •••••.••'
              }
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  style={{
                    background: userData?.isActive !== false ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: userData?.isActive !== false ? '#10B981' : '#EF4444',
                    border: `1px solid ${userData?.isActive !== false ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                  }}
                  className="px-3 py-1 rounded-full text-[11px] font-bold"
                >
                  {userData?.isActive !== false ? '● ACTIVE' : '○ INACTIVE'}
                </div>
              </div>
              <span style={{ color: theme.text.tertiary }} className="text-xs font-medium">
                ID: {userData?.schoolUId || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowConcernModal(true)}
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)',
              borderColor: 'rgba(245,158,11,0.3)'
            }}
            className="p-4 rounded-xl border flex items-center gap-3 transition-all hover:scale-[1.02] hover:shadow-md text-left"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'rgba(245,158,11,0.2)' }}>
              🆘
            </div>
            <div className="flex-1">
              <h4 style={{ color: '#F59E0B' }} className="font-bold text-sm">Report a Concern</h4>
              <p style={{ color: theme.text.secondary }} className="text-xs">Get help with issues</p>
            </div>
            <ChevronRight style={{ color: theme.text.tertiary }} className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowFeedbackModal(true)}
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)',
              borderColor: 'rgba(59,130,246,0.3)'
            }}
            className="p-4 rounded-xl border flex items-center gap-3 transition-all hover:scale-[1.02] hover:shadow-md text-left"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'rgba(59,130,246,0.2)' }}>
              💬
            </div>
            <div className="flex-1">
              <h4 style={{ color: '#3B82F6' }} className="font-bold text-sm">Share Feedback</h4>
              <p style={{ color: theme.text.secondary }} className="text-xs">Rate your experience</p>
            </div>
            <ChevronRight style={{ color: theme.text.tertiary }} className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right Column - Transactions */}
      <div
        style={{ background: theme.bg.card, borderColor: theme.border.primary }}
        className="flex-1 rounded-2xl border overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div style={{ borderColor: theme.border.primary }} className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 style={{ color: theme.accent.primary }} className="text-base font-bold flex items-center gap-2">
              <FileText className="w-4 h-4" /> Recent Transactions
            </h3>
            <p style={{ color: theme.text.secondary }} className="text-xs mt-1">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Buttons */}
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: theme.border.primary }}>
              {[
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'Week' },
                { key: 'month', label: 'Month' }
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    background: filter === f.key ? theme.accent.primary : 'transparent',
                    color: filter === f.key ? (isDarkMode ? '#181D40' : '#FFFFFF') : theme.text.secondary
                  }}
                  className="px-3 py-1.5 text-xs font-semibold transition-all"
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              style={{
                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: theme.text.primary
              }}
              className="p-2 rounded-lg hover:opacity-80 transition flex items-center gap-1"
              title="Export to PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Export</span>
            </button>
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto">
          {transactions.length === 0 ? (
            <div style={{ color: theme.text.tertiary }} className="text-center py-16">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No transactions for this period</p>
              <p className="text-xs mt-1">Try selecting a different time range</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: theme.border.primary }}>
              {transactions.map((tx, idx) => (
                <div
                  key={tx._id || tx.id || idx}
                  className="p-4 flex items-center justify-between hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-3">
                    <div style={{
                      background: tx.transactionType === 'credit' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'
                    }} className="w-10 h-10 rounded-full flex items-center justify-center text-lg">
                      {tx.transactionType === 'credit' ? '💵' : '🛒'}
                    </div>
                    <div>
                      <p style={{ color: theme.text.primary }} className="font-semibold text-sm">
                        {tx.transactionType === 'credit' ? 'Cash-In' : tx.description || 'Purchase'}
                      </p>
                      <p style={{ color: theme.text.muted }} className="text-xs">
                        {tx.date || new Date(tx.createdAt).toLocaleDateString()} {tx.time || ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p style={{ color: tx.transactionType === 'credit' ? '#10B981' : '#EF4444' }} className="font-bold text-sm">
                      {tx.transactionType === 'credit' ? '+' : '-'}P{Math.abs(tx.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Concern Modal */}
      {showConcernModal && (
        <ConcernModal
          onClose={() => setShowConcernModal(false)}
          theme={theme}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          onClose={() => setShowFeedbackModal(false)}
          theme={theme}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}

// =========================================
// CONCERN MODAL - Step-by-step flow
// =========================================
function ConcernModal({ onClose, theme, isDarkMode }) {
  const [step, setStep] = useState(1); // 1: Department, 2: Merchant (if needed), 3: Details, 4: Summary, 5: Success
  const [department, setDepartment] = useState('');
  const [merchant, setMerchant] = useState('');
  const [merchants, setMerchants] = useState([]);
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMerchants, setLoadingMerchants] = useState(false);

  const departments = [
    { value: 'sysad', label: 'NUCash System', icon: '💻', desc: 'Technical issues, app problems' },
    { value: 'treasury', label: 'Finance', icon: '💰', desc: 'Balance, cash-in, payments' },
    { value: 'merchants', label: 'Merchants', icon: '🏪', desc: 'Store-related concerns' },
    { value: 'motorpool', label: 'Shuttle Service', icon: '🚐', desc: 'Transportation concerns' }
  ];

  useEffect(() => {
    if (department === 'merchants') {
      fetchMerchants();
    }
  }, [department]);

  const fetchMerchants = async () => {
    setLoadingMerchants(true);
    try {
      const response = await api.get('/user/merchants');
      if (response.success) {
        setMerchants(response.merchants);
      }
    } catch (error) {
      console.error('Failed to fetch merchants');
      setMerchants([]);
    } finally {
      setLoadingMerchants(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && department) {
      if (department === 'merchants') {
        setStep(2);
      } else {
        setStep(3);
      }
    } else if (step === 2 && merchant) {
      setStep(3);
    } else if (step === 3 && subject && details) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setMerchant('');
    } else if (step === 3) {
      if (department === 'merchants') {
        setStep(2);
      } else {
        setStep(1);
      }
    } else if (step === 4) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.post('/user/concerns', {
        department,
        merchant: department === 'merchants' ? merchant : undefined,
        subject,
        details
      });

      if (response.success) {
        setStep(5);
      }
    } catch (error) {
      console.error('Failed to submit concern');
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentLabel = () => {
    const dept = departments.find(d => d.value === department);
    return dept ? dept.label : '';
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: isDarkMode ? 'rgba(15,18,39,0.6)' : '#F9FAFB',
    border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}`,
    borderRadius: '12px',
    color: theme.text.primary,
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease'
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #1E2347 0%, #181D40 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`
        }}
        className="relative rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #1E2347 0%, #181D40 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: `2px solid ${isDarkMode ? 'rgba(255,212,28,0.3)' : 'rgba(59,130,246,0.3)'}`,
          boxShadow: isDarkMode
            ? '0 25px 50px rgba(0,0,0,0.5)'
            : '0 25px 50px rgba(0,0,0,0.15)'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)',
            borderBottom: `2px solid ${isDarkMode ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)'}`
          }}
          className="px-6 py-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div style={{ background: 'rgba(245,158,11,0.2)' }} className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl">
              🆘
            </div>
            <div>
              <h2 style={{ color: '#F59E0B' }} className="text-xl font-bold">Report a Concern</h2>
              <p style={{ color: theme.text.secondary }} className="text-sm">
                {step < 5 ? `Step ${step} of 4` : 'Complete'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: theme.text.secondary }} className="p-2 hover:opacity-70 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        {step < 5 && (
          <div style={{ background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }} className="h-1">
            <div
              style={{
                width: `${(step / 4) * 100}%`,
                background: '#F59E0B',
                transition: 'width 0.3s ease'
              }}
              className="h-full"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Select Department */}
          {step === 1 && (
            <div className="space-y-4">
              <p style={{ color: theme.text.secondary }} className="text-sm mb-4">
                Select the department you want to report to:
              </p>
              {departments.map((dept) => (
                <button
                  key={dept.value}
                  onClick={() => setDepartment(dept.value)}
                  style={{
                    background: department === dept.value
                      ? (isDarkMode ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)')
                      : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                    border: `2px solid ${department === dept.value
                      ? '#F59E0B'
                      : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`
                  }}
                  className="w-full p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02] text-left"
                >
                  <div style={{ background: 'rgba(245,158,11,0.15)' }} className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {dept.icon}
                  </div>
                  <div className="flex-1">
                    <p style={{ color: theme.text.primary }} className="font-bold">{dept.label}</p>
                    <p style={{ color: theme.text.secondary }} className="text-sm">{dept.desc}</p>
                  </div>
                  {department === dept.value && (
                    <div style={{ background: '#F59E0B' }} className="w-6 h-6 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Select Merchant (only if merchants selected) */}
          {step === 2 && (
            <div className="space-y-4">
              <p style={{ color: theme.text.secondary }} className="text-sm mb-4">
                Select the merchant you want to report:
              </p>
              {loadingMerchants ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-3" style={{ borderColor: '#F59E0B transparent transparent transparent' }} />
                  <p style={{ color: theme.text.secondary }}>Loading merchants...</p>
                </div>
              ) : merchants.length === 0 ? (
                <div className="text-center py-8">
                  <p style={{ color: theme.text.secondary }}>No merchants available</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                  {merchants.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMerchant(m.value)}
                      style={{
                        background: merchant === m.value
                          ? (isDarkMode ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)')
                          : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                        border: `2px solid ${merchant === m.value
                          ? '#F59E0B'
                          : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`
                      }}
                      className="w-full p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.01] text-left"
                    >
                      <div style={{ background: 'rgba(245,158,11,0.15)' }} className="w-10 h-10 rounded-lg flex items-center justify-center text-xl">
                        🏪
                      </div>
                      <p style={{ color: theme.text.primary }} className="font-semibold flex-1">{m.label}</p>
                      {merchant === m.value && (
                        <div style={{ background: '#F59E0B' }} className="w-6 h-6 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Enter Details */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label style={{ color: theme.text.primary }} className="block font-semibold mb-2">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your concern"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                  onBlur={(e) => e.target.style.borderColor = isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}
                />
              </div>
              <div>
                <label style={{ color: theme.text.primary }} className="block font-semibold mb-2">
                  Details <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Please provide more details about your concern..."
                  rows={5}
                  style={{ ...inputStyle, resize: 'none' }}
                  onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                  onBlur={(e) => e.target.style.borderColor = isDarkMode ? 'rgba(255,212,28,0.2)' : 'rgba(59,130,246,0.2)'}
                />
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <div className="space-y-4">
              <p style={{ color: theme.text.secondary }} className="text-sm mb-4">
                Please review your concern before submitting:
              </p>
              <div
                style={{
                  background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`
                }}
                className="rounded-xl p-5 space-y-4"
              >
                <div>
                  <p style={{ color: theme.text.secondary }} className="text-xs uppercase tracking-wide mb-1">Department</p>
                  <p style={{ color: theme.text.primary }} className="font-semibold">{getDepartmentLabel()}</p>
                </div>
                {department === 'merchants' && merchant && (
                  <div>
                    <p style={{ color: theme.text.secondary }} className="text-xs uppercase tracking-wide mb-1">Merchant</p>
                    <p style={{ color: theme.text.primary }} className="font-semibold">{merchant}</p>
                  </div>
                )}
                <div>
                  <p style={{ color: theme.text.secondary }} className="text-xs uppercase tracking-wide mb-1">Subject</p>
                  <p style={{ color: theme.text.primary }} className="font-semibold">{subject}</p>
                </div>
                <div>
                  <p style={{ color: theme.text.secondary }} className="text-xs uppercase tracking-wide mb-1">Details</p>
                  <p style={{ color: theme.text.primary }} className="text-sm whitespace-pre-wrap">{details}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="text-center py-8">
              <div style={{ background: 'rgba(16,185,129,0.2)' }} className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
                <Check className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 style={{ color: '#10B981' }} className="text-2xl font-bold mb-2">Concern Submitted!</h3>
              <p style={{ color: theme.text.secondary }} className="mb-4">
                Your concern has been received. You can track it in your Concerns tab.
              </p>
              <button
                onClick={onClose}
                style={{ background: '#F59E0B', color: '#FFFFFF' }}
                className="px-8 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 5 && (
          <div
            style={{ borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}
            className="px-6 py-4 flex gap-3"
          >
            {step > 1 && (
              <button
                onClick={handleBack}
                style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  color: theme.text.primary
                }}
                className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && !department) ||
                  (step === 2 && !merchant) ||
                  (step === 3 && (!subject || !details))
                }
                style={{ background: '#F59E0B', color: '#FFFFFF' }}
                className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ background: '#10B981', color: '#FFFFFF' }}
                className="flex-1 py-3 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Concern'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================
// FEEDBACK MODAL - Step-by-step flow
// =========================================
function FeedbackModal({ onClose, theme, isDarkMode }) {
  const [step, setStep] = useState(1); // 1: Department, 2: Merchant (if needed), 3: Rating + Details, 4: Summary, 5: Success
  const [department, setDepartment] = useState('');
  const [merchant, setMerchant] = useState('');
  const [merchants, setMerchants] = useState([]);
  const [subject, setSubject] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMerchants, setLoadingMerchants] = useState(false);

  const departments = [
    { value: 'sysad', label: 'NUCash System', icon: '💻', desc: 'App experience feedback' },
    { value: 'treasury', label: 'Finance', icon: '💰', desc: 'Service experience' },
    { value: 'merchants', label: 'Merchants', icon: '🏪', desc: 'Store experience' },
    { value: 'motorpool', label: 'Shuttle Service', icon: '🚐', desc: 'Transport experience' }
  ];

  useEffect(() => {
    if (department === 'merchants') {
      fetchMerchants();
    }
  }, [department]);

  const fetchMerchants = async () => {
    setLoadingMerchants(true);
    try {
      const response = await api.get('/user/merchants');
      if (response.success) {
        setMerchants(response.merchants);
      }
    } catch (error) {
      setMerchants([]);
    } finally {
      setLoadingMerchants(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && department) {
      if (department === 'merchants') {
        setStep(2);
      } else {
        setStep(3);
      }
    } else if (step === 2 && merchant) {
      setStep(3);
    } else if (step === 3 && rating > 0) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setMerchant('');
    } else if (step === 3) {
      if (department === 'merchants') {
        setStep(2);
      } else {
        setStep(1);
      }
    } else if (step === 4) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.post('/user/feedback', {
        department,
        merchant: department === 'merchants' ? merchant : undefined,
        subject: subject || undefined,
        feedback: feedback || undefined,
        rating
      });

      if (response.success) {
        setStep(5);
      }
    } catch (error) {
      console.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentLabel = () => {
    const dept = departments.find(d => d.value === department);
    return dept ? dept.label : '';
  };

  const getRatingLabel = () => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[rating] || '';
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: isDarkMode ? 'rgba(15,18,39,0.6)' : '#F9FAFB',
    border: `2px solid ${isDarkMode ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.2)'}`,
    borderRadius: '12px',
    color: theme.text.primary,
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease'
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #1E2347 0%, #181D40 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: `2px solid ${isDarkMode ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.3)'}`,
          boxShadow: isDarkMode
            ? '0 25px 50px rgba(0,0,0,0.5)'
            : '0 25px 50px rgba(0,0,0,0.15)'
        }}
        className="relative rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div
          style={{
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)',
            borderBottom: `2px solid ${isDarkMode ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'}`
          }}
          className="px-6 py-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div style={{ background: 'rgba(59,130,246,0.2)' }} className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl">
              💬
            </div>
            <div>
              <h2 style={{ color: '#3B82F6' }} className="text-xl font-bold">Share Feedback</h2>
              <p style={{ color: theme.text.secondary }} className="text-sm">
                {step < 5 ? `Step ${step} of 4` : 'Complete'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: theme.text.secondary }} className="p-2 hover:opacity-70 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        {step < 5 && (
          <div style={{ background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }} className="h-1">
            <div
              style={{
                width: `${(step / 4) * 100}%`,
                background: '#3B82F6',
                transition: 'width 0.3s ease'
              }}
              className="h-full"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Select Department */}
          {step === 1 && (
            <div className="space-y-4">
              <p style={{ color: theme.text.secondary }} className="text-sm mb-4">
                Select what you want to give feedback about:
              </p>
              {departments.map((dept) => (
                <button
                  key={dept.value}
                  onClick={() => setDepartment(dept.value)}
                  style={{
                    background: department === dept.value
                      ? (isDarkMode ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)')
                      : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                    border: `2px solid ${department === dept.value
                      ? '#3B82F6'
                      : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`
                  }}
                  className="w-full p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02] text-left"
                >
                  <div style={{ background: 'rgba(59,130,246,0.15)' }} className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {dept.icon}
                  </div>
                  <div className="flex-1">
                    <p style={{ color: theme.text.primary }} className="font-bold">{dept.label}</p>
                    <p style={{ color: theme.text.secondary }} className="text-sm">{dept.desc}</p>
                  </div>
                  {department === dept.value && (
                    <div style={{ background: '#3B82F6' }} className="w-6 h-6 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Select Merchant */}
          {step === 2 && (
            <div className="space-y-4">
              <p style={{ color: theme.text.secondary }} className="text-sm mb-4">
                Select the merchant:
              </p>
              {loadingMerchants ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-3" style={{ borderColor: '#3B82F6 transparent transparent transparent' }} />
                  <p style={{ color: theme.text.secondary }}>Loading merchants...</p>
                </div>
              ) : merchants.length === 0 ? (
                <div className="text-center py-8">
                  <p style={{ color: theme.text.secondary }}>No merchants available</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                  {merchants.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMerchant(m.value)}
                      style={{
                        background: merchant === m.value
                          ? (isDarkMode ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)')
                          : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                        border: `2px solid ${merchant === m.value
                          ? '#3B82F6'
                          : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`
                      }}
                      className="w-full p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.01] text-left"
                    >
                      <div style={{ background: 'rgba(59,130,246,0.15)' }} className="w-10 h-10 rounded-lg flex items-center justify-center text-xl">
                        🏪
                      </div>
                      <p style={{ color: theme.text.primary }} className="font-semibold flex-1">{m.label}</p>
                      {merchant === m.value && (
                        <div style={{ background: '#3B82F6' }} className="w-6 h-6 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Rating + Optional Details */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Star Rating */}
              <div>
                <label style={{ color: theme.text.primary }} className="block font-semibold mb-3">
                  Your Rating <span className="text-red-400">*</span>
                </label>
                <div className="flex justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <svg
                        className="w-12 h-12"
                        fill={star <= (hoveredStar || rating) ? "#FFD41C" : "none"}
                        stroke="#FFD41C"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p style={{ color: '#FFD41C' }} className="text-center font-semibold">
                    {getRatingLabel()}
                  </p>
                )}
              </div>

              {/* Optional Subject */}
              <div>
                <label style={{ color: theme.text.primary }} className="block font-semibold mb-2">
                  Subject <span style={{ color: theme.text.tertiary }} className="font-normal text-sm">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What's this about?"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.2)'}
                />
              </div>

              {/* Optional Feedback */}
              <div>
                <label style={{ color: theme.text.primary }} className="block font-semibold mb-2">
                  Feedback <span style={{ color: theme.text.tertiary }} className="font-normal text-sm">(Optional)</span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'none' }}
                  onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.2)'}
                />
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <div className="space-y-4">
              <p style={{ color: theme.text.secondary }} className="text-sm mb-4">
                Please review your feedback before submitting:
              </p>
              <div
                style={{
                  background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`
                }}
                className="rounded-xl p-5 space-y-4"
              >
                <div>
                  <p style={{ color: theme.text.secondary }} className="text-xs uppercase tracking-wide mb-1">Department</p>
                  <p style={{ color: theme.text.primary }} className="font-semibold">{getDepartmentLabel()}</p>
                </div>
                {department === 'merchants' && merchant && (
                  <div>
                    <p style={{ color: theme.text.secondary }} className="text-xs uppercase tracking-wide mb-1">Merchant</p>
                    <p style={{ color: theme.text.primary }} className="font-semibold">{merchant}</p>
                  </div>
                )}
                <div>
                  <p style={{ color: theme.text.secondary }} className="text-xs uppercase tracking-wide mb-1">Rating</p>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className="w-5 h-5"
                          fill={star <= rating ? "#FFD41C" : "none"}
                          stroke="#FFD41C"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                    <span style={{ color: '#FFD41C' }} className="font-semibold">{getRatingLabel()}</span>
                  </div>
                </div>
                {subject && (
                  <div>
                    <p style={{ color: theme.text.secondary }} className="text-xs uppercase tracking-wide mb-1">Subject</p>
                    <p style={{ color: theme.text.primary }} className="font-semibold">{subject}</p>
                  </div>
                )}
                {feedback && (
                  <div>
                    <p style={{ color: theme.text.secondary }} className="text-xs uppercase tracking-wide mb-1">Feedback</p>
                    <p style={{ color: theme.text.primary }} className="text-sm whitespace-pre-wrap">{feedback}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="text-center py-8">
              <div style={{ background: 'rgba(16,185,129,0.2)' }} className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
                <Check className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 style={{ color: '#10B981' }} className="text-2xl font-bold mb-2">Feedback Submitted!</h3>
              <p style={{ color: theme.text.secondary }} className="mb-4">
                Thank you for your feedback! You can track it in your Concerns tab.
              </p>
              <button
                onClick={onClose}
                style={{ background: '#3B82F6', color: '#FFFFFF' }}
                className="px-8 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 5 && (
          <div
            style={{ borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` }}
            className="px-6 py-4 flex gap-3"
          >
            {step > 1 && (
              <button
                onClick={handleBack}
                style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  color: theme.text.primary
                }}
                className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && !department) ||
                  (step === 2 && !merchant) ||
                  (step === 3 && rating === 0)
                }
                style={{ background: '#3B82F6', color: '#FFFFFF' }}
                className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ background: '#10B981', color: '#FFFFFF' }}
                className="flex-1 py-3 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
