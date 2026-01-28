// src/screens/DeactivateAccountModal.js
// Deactivate account modal for mobile with OTP verification

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import api from '../services/api';

export default function DeactivateAccountModal({ visible, onClose, userEmail, userId }) {
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!userEmail) {
      Alert.alert('Error', 'User email not found');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post('/auth/send-reset-otp', {
        email: userEmail
      });

      if (data.success) {
        Alert.alert('Success', 'OTP sent to your email!');
        setOtpSent(true);
      } else {
        Alert.alert('Error', data.message || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!pin || !otp) {
      Alert.alert('Error', 'Please enter PIN and OTP');
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      Alert.alert('Error', 'PIN must be 6 digits');
      return;
    }

    Alert.alert(
      'Confirm Deactivation',
      'Are you sure you want to deactivate your account? You can reactivate it by contacting ITSO.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              // Verify OTP first
              const verifyRes = await api.post('/auth/verify-reset-otp', {
                email: userEmail,
                otp
              });

              if (!verifyRes.data.success) {
                Alert.alert('Error', 'Invalid or expired OTP');
                return;
              }

              // Deactivate account
              const { data } = await api.post('/user/deactivate', {
                pin,
                email: userEmail,
                otp
              });

              if (data.success) {
                Alert.alert(
                  'Account Deactivated',
                  'Your account has been deactivated. Please contact ITSO to reactivate.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        resetForm();
                        onClose();
                        // You might want to logout here
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Error', data.message || 'Failed to deactivate account');
              }
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to deactivate account');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setPin('');
    setOtp('');
    setOtpSent(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.modalTitle}>Deactivate Account</Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Warning Message */}
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              <Text style={styles.warningBold}>Lost your ID?</Text> Deactivate your account and report it to{' '}
              <Text style={styles.warningLink}>itso@nu-laguna.edu.ph</Text> immediately!
            </Text>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {/* PIN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Enter PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry
                maxLength={6}
                keyboardType="numeric"
                value={pin}
                onChangeText={setPin}
                editable={!loading}
              />
            </View>

            {/* OTP Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Verification</Text>
              <View style={styles.otpRow}>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="Enter OTP"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  maxLength={6}
                  keyboardType="numeric"
                  value={otp}
                  onChangeText={setOtp}
                  editable={!loading && otpSent}
                />
                <TouchableOpacity
                  style={[styles.otpButton, otpSent && styles.otpButtonDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading || otpSent}
                >
                  <Text style={styles.otpButtonText}>
                    {otpSent ? 'Sent' : 'Send OTP'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Deactivate Button */}
            <TouchableOpacity
              style={[styles.deactivateButton, (!otpSent || loading) && styles.deactivateButtonDisabled]}
              onPress={handleDeactivate}
              disabled={!otpSent || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.deactivateButtonText}>Confirm Deactivation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '75%',
    borderTopWidth: 2,
    borderTopColor: '#EF4444',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningIcon: {
    fontSize: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#EF4444',
  },
  modalClose: {
    fontSize: 28,
    color: '#FBFBFB',
    fontWeight: '300',
  },
  warningBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 13,
    color: '#FBFBFB',
    lineHeight: 18,
  },
  warningBold: {
    fontWeight: '700',
  },
  warningLink: {
    color: '#FFD41C',
    textDecorationLine: 'underline',
  },
  contentContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FBFBFB',
    opacity: 0.8,
  },
  input: {
    backgroundColor: '#35408E',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#FBFBFB',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
  },
  otpInput: {
    flex: 1,
  },
  otpButton: {
    backgroundColor: '#35408E',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  otpButtonDisabled: {
    opacity: 0.5,
  },
  otpButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBFBFB',
  },
  deactivateButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  deactivateButtonDisabled: {
    opacity: 0.5,
  },
  deactivateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
