// src/screens/ChangePinModal.js
// Change PIN modal for mobile with OTP verification

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

export default function ChangePinModal({ visible, onClose, userEmail, userId }) {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
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

  const handleChangePin = async () => {
    if (!oldPin || !newPin || !confirmPin || !otp) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!/^\d{6}$/.test(oldPin) || !/^\d{6}$/.test(newPin)) {
      Alert.alert('Error', 'PIN must be 6 digits');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Error', 'New PINs do not match');
      return;
    }

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

      // Change PIN
      const { data } = await api.post('/auth/change-pin-with-otp', {
        currentPin: oldPin,
        newPin: newPin,
        confirmPin: confirmPin,
        email: userEmail,
        otp
      });

      if (data.success) {
        Alert.alert('Success', 'PIN changed successfully!', [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onClose();
            }
          }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to change PIN');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change PIN');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
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
              <Text style={styles.lockIcon}>🔐</Text>
              <Text style={styles.modalTitle}>Change PIN</Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {/* Old PIN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry
                maxLength={6}
                keyboardType="numeric"
                value={oldPin}
                onChangeText={setOldPin}
                editable={!loading}
              />
            </View>

            {/* New PIN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry
                maxLength={6}
                keyboardType="numeric"
                value={newPin}
                onChangeText={setNewPin}
                editable={!loading}
              />
            </View>

            {/* Confirm PIN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry
                maxLength={6}
                keyboardType="numeric"
                value={confirmPin}
                onChangeText={setConfirmPin}
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

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, (!otpSent || loading) && styles.submitButtonDisabled]}
              onPress={handleChangePin}
              disabled={!otpSent || loading}
            >
              {loading ? (
                <ActivityIndicator color="#1E1E1E" />
              ) : (
                <Text style={styles.submitButtonText}>Change PIN</Text>
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
    maxHeight: '85%',
    borderTopWidth: 2,
    borderTopColor: '#35408E',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockIcon: {
    fontSize: 24,
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
    borderColor: '#FFD41C',
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
    borderColor: '#FFD41C',
  },
  otpButtonDisabled: {
    opacity: 0.5,
  },
  otpButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD41C',
  },
  submitButton: {
    backgroundColor: '#FFD41C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
  },
});
