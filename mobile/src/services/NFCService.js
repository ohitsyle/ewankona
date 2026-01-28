// src/services/NFCService.js
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

class NFCService {
  constructor() {
    this.isSupported = false;
  }

  async init() {
    try {
      const supported = await NfcManager.isSupported();
      if (supported) {
        await NfcManager.start();
        this.isSupported = true;
        console.log('NFC initialized successfully');
        return true;
      } else {
        console.warn('NFC not supported on this device');
        return false;
      }
    } catch (ex) {
      console.error('NFC initialization error:', ex);
      return false;
    }
  }

  async readRFIDCard() {
    try {
      await NfcManager.requestTechnology(NfcTech.NfcA);
      const tag = await NfcManager.getTag();
      if (!tag || !tag.id) {
        throw new Error('No tag ID found');
      }
      
      console.log('======================');
      console.log('NFC Card Read');
      console.log('Raw tag.id:', tag.id);
      console.log('Raw tag.id type:', typeof tag.id);
      console.log('Is array:', Array.isArray(tag.id));
      
      const uid = this.bytesToHex(tag.id);
      
      console.log('Converted UID:', uid);
      console.log('UID length:', uid.length);
      console.log('======================');
      
      return {
        success: true,
        uid: uid,
        techTypes: tag.techTypes,
        timestamp: new Date().toISOString()
      };
    } catch (ex) {
      console.warn('Error reading NFC card:', ex);
      return { 
        success: false, 
        error: ex.message || 'Failed to read card'
      };
    } finally {
      await this.stopReading();
    }
  }

  bytesToHex(bytes) {
    if (typeof bytes === 'string') {
      // Remove colons, spaces, dashes and convert to uppercase
      const cleaned = bytes.replace(/[:\s-]/g, '').toUpperCase();
      console.log('String input cleaned:', cleaned);
      return cleaned;
    }
    const hex = bytes
      .map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2))
      .join('')
      .toUpperCase();
    console.log('Array converted to hex:', hex);
    return hex;
  }

  async stopReading() {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (ex) {
      console.warn('Error stopping NFC:', ex);
    }
  }

  async cancelScan() {
    // Alias for stopReading, more explicit name
    console.log('🛑 Cancelling NFC scan...');
    await this.stopReading();
  }

  async isEnabled() {
    try {
      return await NfcManager.isEnabled();
    } catch (ex) {
      return false;
    }
  }

  async cleanup() {
    try {
      await this.stopReading();
      await NfcManager.unregisterTagEvent();
    } catch (ex) {
      console.warn('Cleanup error:', ex);
    }
  }
}

export default new NFCService();