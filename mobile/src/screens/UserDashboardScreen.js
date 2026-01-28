// src/screens/UserDashboardScreen.js
// User dashboard matching shuttle/merchant interface design

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import api from '../services/api';
import ChangePinModal from './ChangePinModal';
import DeactivateAccountModal from './DeactivateAccountModal';

export default function UserDashboardScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showConcernModal, setShowConcernModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [concernMessage, setConcernMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // Get user from route params (passed from login)
  const userId = route.params?.userId;
  const userEmail = route.params?.userEmail;

  useEffect(() => {
    if (userId) {
      fetchDashboardData();

      // Auto-refresh every 2 seconds
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user info and balance
      const userRes = await api.get(`/user/${userId}`);
      setUser(userRes.data);
      setBalance(userRes.data.balance || 0);

      // Fetch recent transactions
      const txRes = await api.get(`/user/${userId}/transactions?limit=10`);
      setTransactions(txRes.data || []);

      // Fetch user concerns
      const concernsRes = await api.get(`/user/${userId}/concerns`);
      setConcerns(concernsRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  const handleSubmitConcern = async () => {
    if (!concernMessage.trim()) {
      Alert.alert('Error', 'Please enter a concern message');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/user/concerns', {
        userId,
        email: userEmail,
        message: concernMessage,
        type: 'concern'
      });

      Alert.alert('Success', 'Your concern has been submitted. We will get back to you soon.');
      setConcernMessage('');
      setShowConcernModal(false);
      await fetchDashboardData();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit concern');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/user/concerns', {
        userId,
        email: userEmail,
        message: feedbackMessage,
        type: 'feedback'
      });

      Alert.alert('Success', 'Thank you for your feedback!');
      setFeedbackMessage('');
      setShowFeedbackModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD41C" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => setShowProfileModal(true)}
          >
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.greetingText}>Hello,</Text>
            <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFD41C"
          />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <View style={styles.balanceAmountRow}>
                <Text style={styles.balanceAmount}>
                  {balanceVisible ? `₱${balance.toFixed(2)}` : '₱ •••••'}
                </Text>
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setBalanceVisible(!balanceVisible)}
                >
                  <Text style={styles.eyeIcon}>{balanceVisible ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>🎓 {user?.schoolUId}</Text>
            </View>
            <View style={[styles.statusBadge, user?.isActive && styles.statusActive]}>
              <Text style={styles.statusText}>{user?.isActive ? '✓ Active' : '✗ Inactive'}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowConcernModal(true)}
          >
            <View style={styles.actionIconCircle}>
              <Text style={styles.actionEmoji}>🎫</Text>
            </View>
            <Text style={styles.actionLabel}>Submit</Text>
            <Text style={styles.actionLabel}>Concern</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowFeedbackModal(true)}
          >
            <View style={styles.actionIconCircle}>
              <Text style={styles.actionEmoji}>💬</Text>
            </View>
            <Text style={styles.actionLabel}>Send</Text>
            <Text style={styles.actionLabel}>Feedback</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => Alert.alert('History', 'Full transaction history coming soon!')}
          >
            <View style={styles.actionIconCircle}>
              <Text style={styles.actionEmoji}>📊</Text>
            </View>
            <Text style={styles.actionLabel}>View</Text>
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>📝</Text>
              <Text style={styles.emptyStateText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((tx, index) => (
              <View key={tx._id || index} style={styles.transactionCard}>
                <View style={styles.transactionIcon}>
                  <Text style={styles.transactionEmoji}>
                    {tx.transactionType === 'debit' ? '💸' : '💰'}
                  </Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>
                    {tx.transactionType === 'debit' ? 'Payment' : 'Load'}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(tx.createdAt || tx.timestamp)}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={[
                    styles.transactionAmountText,
                    tx.transactionType === 'debit' && styles.debitAmount
                  ]}>
                    {tx.transactionType === 'debit' ? '-' : '+'}₱{tx.amount.toFixed(2)}
                  </Text>
                  <View style={[
                    styles.statusPill,
                    tx.status === 'Completed' && styles.statusCompleted,
                    tx.status === 'Pending' && styles.statusPending,
                    tx.status === 'Failed' && styles.statusFailed
                  ]}>
                    <Text style={styles.statusPillText}>{tx.status}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Concerns Section */}
        {concerns.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Concerns</Text>
            </View>

            {concerns.map((concern, index) => (
              <View key={concern._id || index} style={styles.concernCard}>
                <View style={styles.concernHeader}>
                  <View style={[
                    styles.concernBadge,
                    concern.status === 'resolved' && styles.concernResolved
                  ]}>
                    <Text style={styles.concernBadgeText}>
                      {concern.status === 'resolved' ? '✅ Resolved' : '⏳ Pending'}
                    </Text>
                  </View>
                  <Text style={styles.concernDate}>
                    {formatDate(concern.createdAt)}
                  </Text>
                </View>
                <Text style={styles.concernMessage}>{concern.message}</Text>
                {concern.response && (
                  <View style={styles.concernResponse}>
                    <Text style={styles.concernResponseLabel}>Response:</Text>
                    <Text style={styles.concernResponseText}>{concern.response}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile Settings</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </Text>
              </View>
              <Text style={styles.profileName}>{user?.fullName}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.profileSchoolId}>{user?.schoolUId}</Text>
            </View>

            <View style={styles.profileActions}>
              <TouchableOpacity
                style={styles.profileActionButton}
                onPress={() => {
                  setShowProfileModal(false);
                  setShowChangePinModal(true);
                }}
              >
                <Text style={styles.profileActionIcon}>🔐</Text>
                <Text style={styles.profileActionText}>Change PIN</Text>
                <Text style={styles.profileActionArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.profileActionButton, styles.profileActionDanger]}
                onPress={() => {
                  setShowProfileModal(false);
                  setShowDeactivateModal(true);
                }}
              >
                <Text style={styles.profileActionIcon}>⚠️</Text>
                <Text style={styles.profileActionTextDanger}>Deactivate Account</Text>
                <Text style={styles.profileActionArrowDanger}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Concern Modal */}
      <Modal
        visible={showConcernModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConcernModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConcernModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Concern</Text>
              <TouchableOpacity onPress={() => setShowConcernModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Describe your concern and our support team will get back to you.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Type your concern here..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              numberOfLines={6}
              value={concernMessage}
              onChangeText={setConcernMessage}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.modalButton, submitting && styles.modalButtonDisabled]}
              onPress={handleSubmitConcern}
              disabled={submitting}
            >
              <Text style={styles.modalButtonText}>
                {submitting ? 'Submitting...' : 'Submit Concern'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFeedbackModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Feedback</Text>
              <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              We'd love to hear your thoughts on how we can improve!
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Share your feedback..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              numberOfLines={6}
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.modalButton, submitting && styles.modalButtonDisabled]}
              onPress={handleSubmitFeedback}
              disabled={submitting}
            >
              <Text style={styles.modalButtonText}>
                {submitting ? 'Submitting...' : 'Send Feedback'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Change PIN Modal */}
      <ChangePinModal
        visible={showChangePinModal}
        onClose={() => setShowChangePinModal(false)}
        userEmail={userEmail}
        userId={userId}
      />

      {/* Deactivate Account Modal */}
      <DeactivateAccountModal
        visible={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        userEmail={userEmail}
        userId={userId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181D40',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#181D40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FBFBFB',
    marginTop: 15,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 2,
    borderBottomColor: '#35408E',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#35408E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFD41C',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD41C',
  },
  greetingText: {
    fontSize: 14,
    color: '#FBFBFB',
    opacity: 0.7,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FBFBFB',
  },
  logoutButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#35408E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD41C',
  },
  logoutIcon: {
    fontSize: 22,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  balanceCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 25,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#35408E',
  },
  balanceRow: {
    marginBottom: 15,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#FBFBFB',
    opacity: 0.7,
    fontWeight: '600',
    marginBottom: 8,
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFD41C',
    marginRight: 15,
  },
  eyeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#35408E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#35408E',
    paddingTop: 15,
  },
  idBadge: {
    backgroundColor: '#35408E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  idBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD41C',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBFBFB',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 10,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#35408E',
  },
  actionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#35408E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 26,
  },
  actionLabel: {
    fontSize: 11,
    color: '#FBFBFB',
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FBFBFB',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FFD41C',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
  },
  emptyStateEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#FBFBFB',
    opacity: 0.6,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#35408E',
  },
  transactionIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#35408E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 22,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FBFBFB',
    marginBottom: 3,
  },
  transactionDate: {
    fontSize: 12,
    color: '#FBFBFB',
    opacity: 0.6,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 4,
  },
  debitAmount: {
    color: '#EF4444',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#35408E',
  },
  statusCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusPending: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  statusFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FBFBFB',
  },
  concernCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#35408E',
  },
  concernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  concernBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  concernResolved: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  concernBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBFBFB',
  },
  concernDate: {
    fontSize: 11,
    color: '#FBFBFB',
    opacity: 0.6,
  },
  concernMessage: {
    fontSize: 14,
    color: '#FBFBFB',
    lineHeight: 20,
    marginBottom: 8,
  },
  concernResponse: {
    backgroundColor: '#35408E',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  concernResponseLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD41C',
    marginBottom: 4,
  },
  concernResponseText: {
    fontSize: 13,
    color: '#FBFBFB',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: '80%',
    borderTopWidth: 2,
    borderTopColor: '#35408E',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFD41C',
  },
  modalClose: {
    fontSize: 28,
    color: '#FBFBFB',
    fontWeight: '300',
  },
  modalDescription: {
    fontSize: 14,
    color: '#FBFBFB',
    opacity: 0.7,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: '#35408E',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: '#FBFBFB',
    minHeight: 120,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD41C',
  },
  modalButton: {
    backgroundColor: '#FFD41C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  // Profile Modal Styles
  profileInfo: {
    alignItems: 'center',
    marginBottom: 25,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#35408E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#FFD41C',
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFD41C',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FBFBFB',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#FBFBFB',
    opacity: 0.7,
    marginBottom: 5,
  },
  profileSchoolId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD41C',
  },
  profileActions: {
    gap: 12,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#35408E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FFD41C',
  },
  profileActionDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  profileActionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  profileActionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FBFBFB',
  },
  profileActionTextDanger: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  profileActionArrow: {
    fontSize: 20,
    color: '#FFD41C',
  },
  profileActionArrowDanger: {
    fontSize: 20,
    color: '#EF4444',
  },
});
