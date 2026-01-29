// src/pages/user/UserDashboard.jsx
// PayPal-style User Dashboard with balance, transactions, concerns, and feedback
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';
import { Eye, EyeOff, Download, AlertCircle, MessageSquare, Calendar, FileText, ChevronRight } from 'lucide-react';
import { submitAssistanceReport, getReportToOptions, submitFeedback } from '../../services/concernsApi';

export default function UserDashboard() {
  const { theme, isDarkMode } = useTheme();
  const [userData, setUserData] = useState(null);
  const [balance, setBalance] = useState(0);
  const [showBalance, setShowBalance] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today'); // today, week, month
  const intervalRef = useRef(null);

  // Modal states
  const [showConcernModal, setShowConcernModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // Fetch user balance
      const balanceData = await api.get('/user/balance');
      if (balanceData?.balance !== undefined) {
        setBalance(balanceData.balance);
      }

      // Fetch all transactions (we'll filter locally for better UX)
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

  // Filter transactions based on selected period
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
    // Get user data from localStorage
    const data = localStorage.getItem('userData');
    if (data && data !== 'undefined' && data !== 'null') {
      try {
        setUserData(JSON.parse(data));
      } catch (e) {
        console.error('Error parsing userData');
      }
    }

    fetchData();

    // Auto-refresh every 10 seconds
    intervalRef.current = setInterval(() => fetchData(true), 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Re-filter when filter changes
  useEffect(() => {
    filterTransactions(allTransactions, filter);
  }, [filter, allTransactions]);

  // Export transactions to PDF-style format
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
    <div className="h-full flex flex-col lg:flex-row gap-5">
      {/* Left Column - Balance + Actions */}
      <div className="w-full lg:w-[340px] flex flex-col gap-5 flex-shrink-0">

        {/* Balance Card */}
        <div
          style={{ background: theme.bg.card, borderColor: theme.border.primary }}
          className="p-6 rounded-2xl border relative overflow-hidden"
        >
          <div className="absolute right-4 top-4 text-[60px] opacity-10">💰</div>

          <div className="flex items-center justify-between mb-3">
            <div style={{ color: theme.text.secondary }} className="text-xs font-bold uppercase tracking-wide">
              NUCash Balance
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              style={{ color: theme.text.secondary }}
              className="p-2 rounded-lg hover:bg-white/10 transition"
            >
              {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative z-10">
            <div style={{ color: '#10B981' }} className="text-4xl font-extrabold mb-3">
              {showBalance
                ? `P${balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                : 'P *** ***.**'
              }
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div
                style={{
                  background: userData?.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                  color: userData?.isActive ? '#10B981' : '#EF4444'
                }}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              >
                {userData?.isActive ? 'ACTIVE' : 'INACTIVE'}
              </div>
              <span style={{ color: theme.text.tertiary }} className="text-xs">
                {userData?.schoolUId}
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
        className="flex-1 rounded-2xl border overflow-hidden flex flex-col min-h-[400px]"
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
          isOpen={showConcernModal}
          onClose={() => setShowConcernModal(false)}
          theme={theme}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          theme={theme}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}

// =========================================
// CONCERN MODAL COMPONENT
// =========================================
function ConcernModal({ isOpen, onClose, theme, isDarkMode }) {
  const [reportTo, setReportTo] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState("");
  const [subject, setSubject] = useState("");
  const [concern, setConcern] = useState("");
  const [otherConcern, setOtherConcern] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [merchantOptions, setMerchantOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const reportToOptions = [
    { value: "ITSO", label: "ITSO" },
    { value: "Treasury Office", label: "Treasury Office" },
    { value: "NU Shuttle Service", label: "NU Shuttle Service" },
    { value: "Merchants", label: "Merchants" }
  ];

  const ITSOConcerns = [
    "The system doesn't recognize my ID / Unable to tap ID",
    "My RFID card is damaged or not working",
    "Others"
  ];

  const treasuryConcerns = [
    "Cash-in transaction not reflected in account",
    "Incorrect amount loaded to account",
    "Account balance discrepancy after cash-in",
    "Others"
  ];

  const isShuttleService = reportTo === "NU Shuttle Service";
  const isMerchants = reportTo === "Merchants";

  const getConcerns = () => {
    if (reportTo === "ITSO") return ITSOConcerns;
    if (reportTo === "Treasury Office") return treasuryConcerns;
    return [];
  };

  const concerns = getConcerns();

  useEffect(() => {
    if (isOpen && merchantOptions.length === 0) {
      fetchMerchantOptions();
    }
  }, [isOpen]);

  const fetchMerchantOptions = async () => {
    setLoadingOptions(true);
    try {
      const response = await getReportToOptions();
      if (response.success) {
        const merchants = response.options.filter(
          opt => !["ITSO", "Treasury Office", "NU Shuttle Service"].includes(opt.value)
        );
        setMerchantOptions(merchants);
      }
    } catch (error) {
      console.error('Failed to fetch merchant options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const reportData = {
        reportTo: isMerchants ? selectedMerchant : reportTo,
        concern: isShuttleService ? "Shuttle Service Concern" : concern,
        subject: isMerchants ? subject : (concern === "Others" ? subject : concern),
        otherConcern: isShuttleService ? otherConcern : (isMerchants ? otherConcern : (concern === "Others" ? otherConcern : "")),
        plateNumber: isShuttleService ? plateNumber : undefined
      };

      const response = await submitAssistanceReport(reportData);

      if (response.success) {
        setShowSuccess(true);
        setTimeout(onClose, 1500);
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = reportTo && (
    isShuttleService
      ? (plateNumber.trim() && otherConcern.trim())
      : isMerchants
        ? (selectedMerchant && subject.trim() && otherConcern.trim())
        : (concern && (concern !== "Others" || (subject.trim() && otherConcern.trim())))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border">
        <div style={{ borderColor: theme.border.primary }} className="p-5 border-b flex justify-between items-center">
          <h3 style={{ color: theme.accent.primary }} className="text-lg font-bold">🆘 Report a Concern</h3>
          <button onClick={onClose} style={{ color: theme.text.secondary }} className="hover:opacity-75 text-xl">×</button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h4 className="text-green-500 text-xl font-bold mb-2">Report Submitted!</h4>
              <p style={{ color: theme.text.secondary }} className="text-sm">We'll get back to you soon.</p>
            </div>
          ) : (
            <>
              <div>
                <label style={{ color: theme.text.secondary }} className="block text-sm font-semibold mb-2">
                  Report To: <span className="text-red-400">*</span>
                </label>
                <select
                  value={reportTo}
                  onChange={(e) => {
                    setReportTo(e.target.value);
                    setSelectedMerchant("");
                    setConcern("");
                    setOtherConcern("");
                    setSubject("");
                    setPlateNumber("");
                  }}
                  style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                  className="w-full border rounded-lg px-4 py-3 focus:outline-none"
                >
                  <option value="">Select department</option>
                  {reportToOptions.map((opt, i) => <option key={i} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              {isMerchants && (
                <div>
                  <label style={{ color: theme.text.secondary }} className="block text-sm font-semibold mb-2">
                    Select Merchant: <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={selectedMerchant}
                    onChange={(e) => setSelectedMerchant(e.target.value)}
                    disabled={loadingOptions}
                    style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                    className="w-full border rounded-lg px-4 py-3 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">{loadingOptions ? 'Loading...' : 'Select merchant'}</option>
                    {merchantOptions.map((m, i) => <option key={i} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              )}

              {isShuttleService ? (
                <>
                  <div>
                    <label style={{ color: theme.text.secondary }} className="block text-sm font-semibold mb-2">
                      Plate Number: <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                      placeholder="e.g., ABC 1234"
                      style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                      className="w-full border rounded-lg px-4 py-3 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label style={{ color: theme.text.secondary }} className="block text-sm font-semibold mb-2">
                      Concern: <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={otherConcern}
                      onChange={(e) => setOtherConcern(e.target.value)}
                      placeholder="Describe your concern..."
                      rows={4}
                      style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                      className="w-full border rounded-lg px-4 py-3 focus:outline-none resize-none"
                    />
                  </div>
                </>
              ) : isMerchants && selectedMerchant ? (
                <>
                  <div>
                    <label style={{ color: theme.text.secondary }} className="block text-sm font-semibold mb-2">
                      Subject: <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description"
                      style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                      className="w-full border rounded-lg px-4 py-3 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label style={{ color: theme.text.secondary }} className="block text-sm font-semibold mb-2">
                      Details: <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={otherConcern}
                      onChange={(e) => setOtherConcern(e.target.value)}
                      placeholder="Describe your concern..."
                      rows={4}
                      style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                      className="w-full border rounded-lg px-4 py-3 focus:outline-none resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  {reportTo && concerns.length > 0 && (
                    <div>
                      <label style={{ color: theme.text.secondary }} className="block text-sm font-semibold mb-2">
                        Concern: <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={concern}
                        onChange={(e) => setConcern(e.target.value)}
                        style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                        className="w-full border rounded-lg px-4 py-3 focus:outline-none"
                      >
                        <option value="">Select concern</option>
                        {concerns.map((c, i) => <option key={i} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                  {concern === "Others" && (
                    <>
                      <div>
                        <label style={{ color: theme.text.secondary }} className="block text-sm font-semibold mb-2">
                          Subject: <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Brief description"
                          style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                          className="w-full border rounded-lg px-4 py-3 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label style={{ color: theme.text.secondary }} className="block text-sm font-semibold mb-2">
                          Details: <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={otherConcern}
                          onChange={(e) => setOtherConcern(e.target.value)}
                          placeholder="Describe your concern..."
                          rows={4}
                          style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                          className="w-full border rounded-lg px-4 py-3 focus:outline-none resize-none"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {!showSuccess && (
          <div style={{ borderColor: theme.border.primary }} className="flex justify-end gap-3 px-6 py-4 border-t">
            <button
              onClick={onClose}
              disabled={loading}
              style={{ background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB', color: theme.text.primary }}
              className="px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
              style={{
                background: (!isFormValid || loading) ? '#6B7280' : theme.accent.primary,
                color: (!isFormValid || loading) ? '#D1D5DB' : (isDarkMode ? '#181D40' : '#FFFFFF')
              }}
              className="px-5 py-2.5 rounded-lg font-bold disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================
// FEEDBACK MODAL COMPONENT
// =========================================
function FeedbackModal({ isOpen, onClose, theme, isDarkMode }) {
  const [reportTo, setReportTo] = useState("");
  const [subject, setSubject] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportToOptions, setReportToOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (isOpen && reportToOptions.length === 0) {
      fetchOptions();
    }
  }, [isOpen]);

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const response = await getReportToOptions();
      if (response.success) {
        setReportToOptions(response.options);
      }
    } catch (error) {
      setReportToOptions([
        { value: "ITSO", label: "ITSO" },
        { value: "NU Shuttle Service", label: "NU Shuttle Service" }
      ]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await submitFeedback({
        reportTo,
        subject: subject || undefined,
        feedback: feedback || undefined,
        rating
      });

      if (response.success) {
        setShowSuccess(true);
        setTimeout(onClose, 1500);
      }
    } catch (error) {
      console.error('Submit feedback error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = reportTo && rating > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div style={{ background: theme.bg.card, borderColor: theme.border.primary }} className="rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border">
        <div style={{ borderColor: theme.border.primary }} className="p-5 border-b flex justify-between items-center">
          <h3 style={{ color: theme.accent.primary }} className="text-lg font-bold">💬 Share Feedback</h3>
          <button onClick={onClose} style={{ color: theme.text.secondary }} className="hover:opacity-75 text-xl">×</button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h4 className="text-green-500 text-xl font-bold mb-2">Feedback Submitted!</h4>
              <p style={{ color: theme.text.secondary }} className="text-sm">Thank you for your feedback!</p>
            </div>
          ) : (
            <>
              <div>
                <label style={{ color: theme.text.secondary }} className="block text-sm font-semibold mb-2">
                  Report To: <span className="text-red-400">*</span>
                </label>
                <select
                  value={reportTo}
                  onChange={(e) => setReportTo(e.target.value)}
                  disabled={loadingOptions}
                  style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                  className="w-full border rounded-lg px-4 py-3 focus:outline-none disabled:opacity-50"
                >
                  <option value="">{loadingOptions ? 'Loading...' : 'Select department'}</option>
                  {reportToOptions.map((opt, i) => <option key={i} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ color: theme.text.secondary }} className="block text-sm font-semibold mb-2">
                  Subject: <span style={{ color: theme.text.tertiary }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What's this about?"
                  maxLength={100}
                  style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                  className="w-full border rounded-lg px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label style={{ color: theme.text.secondary }} className="block text-sm font-semibold mb-2">
                  Feedback: <span style={{ color: theme.text.tertiary }}>(Optional)</span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  maxLength={500}
                  style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB', color: theme.text.primary, borderColor: theme.border.primary }}
                  className="w-full border rounded-lg px-4 py-3 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label style={{ color: theme.text.secondary }} className="block text-sm font-semibold mb-3">
                  Rating: <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2 justify-center">
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
                        className="w-10 h-10"
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
                  <p style={{ color: theme.text.secondary }} className="text-xs mt-2 text-center">
                    You rated: {rating} star{rating !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {!showSuccess && (
          <div style={{ borderColor: theme.border.primary }} className="flex justify-end gap-3 px-6 py-4 border-t">
            <button
              onClick={onClose}
              disabled={loading}
              style={{ background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB', color: theme.text.primary }}
              className="px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
              style={{
                background: (!isFormValid || loading) ? '#6B7280' : theme.accent.primary,
                color: (!isFormValid || loading) ? '#D1D5DB' : (isDarkMode ? '#181D40' : '#FFFFFF')
              }}
              className="px-5 py-2.5 rounded-lg font-bold disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
