// src/pages/admin/Sysad/TransferCard.jsx
// Transfer RFID card data from one card to another

import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import { CreditCard, ArrowRight, Search, AlertTriangle, CheckCircle, Loader2, User, DollarSign, History } from 'lucide-react';

export default function TransferCard() {
  const { theme, isDarkMode } = useTheme();
  const [oldCardId, setOldCardId] = useState('');
  const [newCardId, setNewCardId] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [searching, setSearching] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);

  // Purple accent for sysad
  const accentColor = '#8B5CF6';

  const handleSearchOldCard = async () => {
    if (!oldCardId.trim()) {
      toast.error('Please enter the old card ID');
      return;
    }

    setSearching(true);
    setUserInfo(null);
    setTransferComplete(false);

    try {
      const data = await api.get(`/admin/sysad/card-lookup?cardUid=${oldCardId.trim()}`);
      if (data?.user) {
        setUserInfo(data.user);
        toast.success('User found');
      } else {
        toast.error('No user found with this card');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to find card');
    } finally {
      setSearching(false);
    }
  };

  const handleTransfer = async () => {
    if (!oldCardId.trim() || !newCardId.trim()) {
      toast.error('Please enter both old and new card IDs');
      return;
    }

    if (oldCardId.trim() === newCardId.trim()) {
      toast.error('Old and new card IDs must be different');
      return;
    }

    if (!userInfo) {
      toast.error('Please search for a valid user first');
      return;
    }

    if (!window.confirm(`Are you sure you want to transfer all data from card "${oldCardId}" to card "${newCardId}"? The old card will be deactivated.`)) {
      return;
    }

    setTransferring(true);
    try {
      await api.post('/admin/sysad/transfer-card', {
        oldCardUid: oldCardId.trim(),
        newCardUid: newCardId.trim()
      });

      toast.success('Card transfer successful!');
      setTransferComplete(true);
    } catch (error) {
      toast.error(error.message || 'Failed to transfer card');
    } finally {
      setTransferring(false);
    }
  };

  const handleReset = () => {
    setOldCardId('');
    setNewCardId('');
    setUserInfo(null);
    setTransferComplete(false);
  };

  return (
    <div className="min-h-[calc(100vh-220px)] flex flex-col">
      {/* Header */}
      <div style={{ borderColor: theme.border.primary }} className="mb-6 border-b-2 pb-5">
        <h2 style={{ color: accentColor }} className="text-2xl font-bold m-0 mb-2 flex items-center gap-[10px]">
          <span>💳</span> Transfer Card
        </h2>
        <p style={{ color: theme.text.secondary }} className="text-[13px] m-0">
          Transfer user data from one RFID card to another (for lost or damaged cards)
        </p>
      </div>

      {/* Warning Notice */}
      <div
        style={{
          background: 'rgba(245,158,11,0.1)',
          borderColor: 'rgba(245,158,11,0.3)'
        }}
        className="p-4 rounded-xl border mb-6 flex items-start gap-3"
      >
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p style={{ color: '#F59E0B' }} className="font-semibold">Important Notice</p>
          <p style={{ color: theme.text.secondary }} className="text-sm mt-1">
            This action will transfer all user data including balance and transaction history to the new card.
            The old card will be permanently disassociated from the account and cannot be used.
          </p>
        </div>
      </div>

      {/* Transfer Complete Success */}
      {transferComplete && (
        <div
          style={{
            background: 'rgba(16,185,129,0.1)',
            borderColor: 'rgba(16,185,129,0.3)'
          }}
          className="p-6 rounded-xl border mb-6 text-center"
        >
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
          <h3 style={{ color: '#10B981' }} className="text-xl font-bold mb-2">Transfer Successful!</h3>
          <p style={{ color: theme.text.secondary }} className="mb-4">
            All user data has been transferred to the new card. The old card has been deactivated.
          </p>
          <button
            onClick={handleReset}
            style={{ background: accentColor, color: '#FFFFFF' }}
            className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Transfer Another Card
          </button>
        </div>
      )}

      {/* Main Transfer Form */}
      {!transferComplete && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Old Card */}
          <div
            style={{ background: theme.bg.card, borderColor: theme.border.primary }}
            className="p-6 rounded-2xl border"
          >
            <h3 style={{ color: theme.text.primary }} className="font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" style={{ color: '#EF4444' }} />
              Old Card (Source)
            </h3>
            <p style={{ color: theme.text.secondary }} className="text-sm mb-4">
              Enter the RFID card UID that is lost or damaged
            </p>

            <div className="space-y-4">
              <div>
                <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">
                  Card UID *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={oldCardId}
                    onChange={(e) => setOldCardId(e.target.value)}
                    placeholder="Enter old card UID..."
                    style={{
                      background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                      color: theme.text.primary,
                      borderColor: theme.border.primary
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none font-mono"
                    disabled={searching || transferring}
                  />
                  <button
                    onClick={handleSearchOldCard}
                    disabled={searching || transferring || !oldCardId.trim()}
                    style={{ background: accentColor, color: '#FFFFFF' }}
                    className="px-4 py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div
              style={{ background: theme.bg.card, borderColor: theme.border.primary }}
              className="w-16 h-16 rounded-full border flex items-center justify-center"
            >
              <ArrowRight style={{ color: accentColor }} className="w-8 h-8" />
            </div>
          </div>

          {/* New Card */}
          <div
            style={{ background: theme.bg.card, borderColor: theme.border.primary }}
            className="p-6 rounded-2xl border"
          >
            <h3 style={{ color: theme.text.primary }} className="font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" style={{ color: '#10B981' }} />
              New Card (Destination)
            </h3>
            <p style={{ color: theme.text.secondary }} className="text-sm mb-4">
              Enter the new RFID card UID to transfer data to
            </p>

            <div className="space-y-4">
              <div>
                <label style={{ color: theme.text.secondary }} className="block text-xs font-semibold uppercase mb-2">
                  Card UID *
                </label>
                <input
                  type="text"
                  value={newCardId}
                  onChange={(e) => setNewCardId(e.target.value)}
                  placeholder="Enter new card UID..."
                  style={{
                    background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB',
                    color: theme.text.primary,
                    borderColor: theme.border.primary
                  }}
                  className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none font-mono"
                  disabled={searching || transferring || !userInfo}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Info Preview */}
      {userInfo && !transferComplete && (
        <div
          style={{ background: theme.bg.card, borderColor: accentColor }}
          className="mt-6 p-6 rounded-2xl border-2"
        >
          <h3 style={{ color: theme.text.primary }} className="font-bold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" style={{ color: accentColor }} />
            User Information (To Be Transferred)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* User Details */}
            <div
              style={{ background: isDarkMode ? 'rgba(15,18,39,0.5)' : '#F9FAFB', borderColor: theme.border.primary }}
              className="p-4 rounded-xl border"
            >
              <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase mb-2">Name</p>
              <p style={{ color: theme.text.primary }} className="font-bold text-lg">
                {`${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'N/A'}
              </p>
              <p style={{ color: theme.text.muted }} className="text-sm mt-1">
                {userInfo.email || 'N/A'}
              </p>
            </div>

            {/* Balance */}
            <div
              style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }}
              className="p-4 rounded-xl border"
            >
              <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase mb-2 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Current Balance
              </p>
              <p className="font-bold text-2xl text-emerald-500">
                ₱{(userInfo.balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Transaction Count */}
            <div
              style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' }}
              className="p-4 rounded-xl border"
            >
              <p style={{ color: theme.text.secondary }} className="text-xs font-semibold uppercase mb-2 flex items-center gap-1">
                <History className="w-3 h-3" /> Transactions
              </p>
              <p className="font-bold text-2xl text-blue-500">
                {userInfo.transactionCount || 0}
              </p>
              <p style={{ color: theme.text.muted }} className="text-xs mt-1">Total transactions</p>
            </div>
          </div>

          {/* Transfer Button */}
          <div className="flex justify-center">
            <button
              onClick={handleTransfer}
              disabled={transferring || !newCardId.trim()}
              style={{ background: accentColor, color: '#FFFFFF' }}
              className="px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-3"
            >
              {transferring ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <CreditCard className="w-6 h-6" />
                  Transfer Card Data
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!userInfo && !transferComplete && (
        <div
          style={{ background: theme.bg.card, borderColor: theme.border.primary }}
          className="mt-6 p-6 rounded-2xl border"
        >
          <h3 style={{ color: theme.text.primary }} className="font-bold mb-4">How to Transfer a Card</h3>
          <ol style={{ color: theme.text.secondary }} className="space-y-3 text-sm list-decimal list-inside">
            <li>Enter the <strong>old card UID</strong> (the lost or damaged card) and click Search</li>
            <li>Verify the user information displayed is correct</li>
            <li>Enter the <strong>new card UID</strong> (the replacement card)</li>
            <li>Click <strong>Transfer Card Data</strong> to complete the transfer</li>
            <li>The old card will be permanently deactivated</li>
          </ol>
        </div>
      )}
    </div>
  );
}
