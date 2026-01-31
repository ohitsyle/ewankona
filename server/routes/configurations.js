// nucash-server/routes/configurations.js
// System configurations endpoints (auto-exports, excuse slips, etc.)

import express from 'express';
const router = express.Router();
import Configuration from '../models/Configuration.js';
import ExcuseSlip from '../models/ExcuseSlip.js';
import ExportHistory from '../models/ExportHistory.js';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import { exportByType } from '../utils/csvExporter.js';
import { sendEmail } from '../services/emailService.js';

// ============================================================
// CONFIGURATION MANAGEMENT
// ============================================================

/**
 * GET /admin/configurations
 * Get all system configurations
 */
router.get('/', async (req, res) => {
  try {
    const configs = await Configuration.find();

    // If no configs exist, return defaults
    if (configs.length === 0) {
      return res.json({
        autoExport: {
          enabled: false,
          frequency: 'daily',
          exportTypes: [],
          time: '00:00',
          emailRecipients: []
        },
        excuseSlips: {
          enabled: true,
          validityHours: 24,
          requireDriverApproval: true,
          template: 'This is to certify that {studentName} ({schoolId}) was delayed due to shuttle service delay on {date}. Delay duration: {delayMinutes} minutes. Route: {routeName}.'
        },
        tabVisibility: {
          home: true,
          drivers: true,
          shuttles: true,
          routes: true,
          phones: true,
          trips: true,
          concerns: true,
          promotions: true,
          configurations: true,
          logs: true
        }
      });
    }

    // Combine all configs into a single object
    const configObj = {};
    for (const config of configs) {
      if (config.configType === 'autoExport') {
        configObj.autoExport = config.autoExport;
      } else if (config.configType === 'excuseSlips') {
        configObj.excuseSlips = config.excuseSlips;
      } else if (config.configType === 'tabVisibility') {
        configObj.tabVisibility = config.tabVisibility;
      }
    }

    res.json(configObj);
  } catch (error) {
    console.error('Error fetching configurations:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
});

/**
 * PUT /admin/configurations
 * Update system configurations
 */
router.put('/', async (req, res) => {
  try {
    const { autoExport, excuseSlips } = req.body;

    // Update auto export configuration
    if (autoExport) {
      await Configuration.findOneAndUpdate(
        { configType: 'autoExport' },
        { configType: 'autoExport', autoExport, updatedAt: Date.now() },
        { upsert: true, new: true }
      );
    }

    // Update excuse slips configuration
    if (excuseSlips) {
      await Configuration.findOneAndUpdate(
        { configType: 'excuseSlips' },
        { configType: 'excuseSlips', excuseSlips, updatedAt: Date.now() },
        { upsert: true, new: true }
      );
    }

    res.json({ message: 'Configurations updated successfully' });
  } catch (error) {
    console.error('Error updating configurations:', error);
    res.status(500).json({ error: 'Failed to update configurations' });
  }
});

/**
 * PUT /admin/configurations/auto-export
 * Update auto-export configuration
 */
router.put('/auto-export', async (req, res) => {
  try {
    await Configuration.findOneAndUpdate(
      { configType: 'autoExport' },
      { configType: 'autoExport', autoExport: req.body, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Auto-export configuration updated successfully' });
  } catch (error) {
    console.error('Error updating auto-export config:', error);
    res.status(500).json({ error: 'Failed to update auto-export configuration' });
  }
});

/**
 * PUT /admin/configurations/excuse-slips
 * Update excuse slips configuration
 */
router.put('/excuse-slips', async (req, res) => {
  try {
    await Configuration.findOneAndUpdate(
      { configType: 'excuseSlips' },
      { configType: 'excuseSlips', excuseSlips: req.body, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Excuse slip configuration updated successfully' });
  } catch (error) {
    console.error('Error updating excuse slip config:', error);
    res.status(500).json({ error: 'Failed to update excuse slip configuration' });
  }
});

/**
 * GET /admin/configurations/tab-visibility
 * Get tab visibility configuration
 */
router.get('/tab-visibility', async (req, res) => {
  try {
    let config = await Configuration.findOne({ configType: 'tabVisibility' });

    if (!config) {
      // Return defaults if no config exists
      return res.json({
        home: true,
        drivers: true,
        shuttles: true,
        routes: true,
        phones: true,
        trips: true,
        concerns: true,
        promotions: true,
        configurations: true,
        logs: true
      });
    }

    res.json(config.tabVisibility);
  } catch (error) {
    console.error('Error fetching tab visibility:', error);
    res.status(500).json({ error: 'Failed to fetch tab visibility configuration' });
  }
});

/**
 * PUT /admin/configurations/tab-visibility
 * Update tab visibility configuration
 */
router.put('/tab-visibility', async (req, res) => {
  try {
    await Configuration.findOneAndUpdate(
      { configType: 'tabVisibility' },
      { configType: 'tabVisibility', tabVisibility: req.body, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Tab visibility configuration updated successfully' });
  } catch (error) {
    console.error('Error updating tab visibility config:', error);
    res.status(500).json({ error: 'Failed to update tab visibility configuration' });
  }
});

// ============================================================
// CSV EXPORT ENDPOINTS
// ============================================================

/**
 * POST /admin/configurations/manual-export
 * Manually trigger export
 */
router.post('/manual-export', async (req, res) => {
  try {
    const { exportType } = req.body;

    if (!exportType) {
      return res.status(400).json({ error: 'Export type is required' });
    }

    const { csv, count } = await exportByType(exportType);
    const fileName = `${exportType}_export_${new Date().toISOString().split('T')[0]}.csv`;

    // Log export history
    await new ExportHistory({
      exportType,
      fileName,
      recordCount: count,
      triggeredBy: 'manual',
      status: 'success'
    }).save();

    // Return CSV data as base64 for download
    const base64Data = Buffer.from(csv).toString('base64');
    res.json({
      message: 'Export successful',
      fileName,
      recordCount: count,
      downloadUrl: `data:text/csv;base64,${base64Data}`
    });
  } catch (error) {
    console.error('Error manual export:', error);

    // Log failed export
    if (req.body.exportType) {
      await new ExportHistory({
        exportType: req.body.exportType,
        fileName: '',
        status: 'failed',
        errorMessage: error.message,
        triggeredBy: 'manual'
      }).save();
    }

    res.status(500).json({ error: 'Failed to export data' });
  }
});

/**
 * POST /admin/configurations/manual-export-all
 * Export all data types as a ZIP file with optional date range filtering
 */
router.post('/manual-export-all', async (req, res) => {
  try {
    const { startDate, endDate, dateRange } = req.body;
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip();

    // Prepare date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.startDate = startDate;
      dateFilter.endDate = endDate;
    }

    const exportTypes = ['drivers', 'trips', 'transactions', 'users', 'shuttles', 'routes', 'logs', 'phones', 'concerns', 'merchants'];
    let totalRecords = 0;

    // Export each type and add to ZIP with date filtering
    for (const type of exportTypes) {
      try {
        const { csv, count } = await exportByType(type, dateFilter);
        const fileName = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
        zip.addFile(fileName, Buffer.from(csv, 'utf8'));
        totalRecords += count;
      } catch (error) {
        console.error(`Error exporting ${type}:`, error);
        // Continue with other exports even if one fails
      }
    }

    const dateRangeLabel = dateRange ? `_${dateRange}` : '';
    const zipFileName = `nucash_export_all${dateRangeLabel}_${new Date().toISOString().split('T')[0]}.zip`;
    const zipBuffer = zip.toBuffer();

    // Log export history with file data stored as base64
    const base64Data = zipBuffer.toString('base64');
    const exportRecord = await new ExportHistory({
      exportType: 'all',
      fileName: zipFileName,
      recordCount: totalRecords,
      triggeredBy: 'manual',
      status: 'success',
      fileData: base64Data, // Store file data for later download
      fileSize: `${(zipBuffer.length / 1024).toFixed(2)} KB`
    }).save();

    // Return ZIP data as base64 for download
    res.json({
      message: 'All data exported successfully',
      fileName: zipFileName,
      totalRecords,
      downloadUrl: `data:application/zip;base64,${base64Data}`,
      exportId: exportRecord._id
    });
  } catch (error) {
    console.error('Error exporting all data:', error);

    // Log failed export
    await new ExportHistory({
      exportType: 'all',
      fileName: '',
      status: 'failed',
      errorMessage: error.message,
      triggeredBy: 'manual'
    }).save();

    res.status(500).json({ error: 'Failed to export all data' });
  }
});

/**
 * GET /admin/configurations/export/:type
 * Export data as CSV
 */
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { csv, count } = await exportByType(type);

    const fileName = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;

    // Log export history
    await new ExportHistory({
      exportType: type,
      fileName,
      recordCount: count,
      triggeredBy: 'manual',
      status: 'success'
    }).save();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting data:', error);

    // Log failed export
    await new ExportHistory({
      exportType: req.params.type,
      fileName: '',
      status: 'failed',
      errorMessage: error.message,
      triggeredBy: 'manual'
    }).save();

    res.status(500).json({ error: 'Failed to export data' });
  }
});

/**
 * GET /admin/configurations/export-history
 * Get export history (manual exports only)
 * Query params: adminRole (optional) - filter by admin role (treasury, merchant, motorpool, sysad)
 */
router.get('/export-history', async (req, res) => {
  try {
    const { adminRole } = req.query;
    const query = { triggeredBy: 'manual' };

    // Filter by admin role if provided
    if (adminRole) {
      query.adminRole = adminRole;
    }

    const history = await ExportHistory.find(query)
      .sort({ exportedAt: -1 })
      .limit(50);
    res.json(history);
  } catch (error) {
    console.error('Error fetching export history:', error);
    res.status(500).json({ error: 'Failed to fetch export history' });
  }
});

/**
 * GET /admin/configurations/scheduled-exports
 * Get scheduled (automatic) export history
 * Query params: adminRole (optional) - filter by admin role (treasury, merchant, motorpool, sysad)
 */
router.get('/scheduled-exports', async (req, res) => {
  try {
    const { adminRole } = req.query;
    const query = { triggeredBy: 'automatic' };

    // Filter by admin role if provided
    if (adminRole) {
      query.adminRole = adminRole;
    }

    const scheduledExports = await ExportHistory.find(query)
      .sort({ exportedAt: -1 })
      .limit(100);
    res.json(scheduledExports);
  } catch (error) {
    console.error('Error fetching scheduled exports:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled exports' });
  }
});

/**
 * POST /admin/configurations/manual-export-motorpool
 * Manually trigger motorpool export (multiple types as ZIP)
 */
router.post('/manual-export-motorpool', async (req, res) => {
  try {
    const { exportTypes } = req.body;

    if (!exportTypes || !Array.isArray(exportTypes) || exportTypes.length === 0) {
      return res.status(400).json({ error: 'Export types array is required' });
    }

    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip();
    let totalRecords = 0;

    // Export each selected type and add to ZIP
    for (const type of exportTypes) {
      try {
        const { csv, count } = await exportByType(type);
        const fileName = `${type.toLowerCase()}_export_${new Date().toISOString().split('T')[0]}.csv`;
        zip.addFile(fileName, Buffer.from(csv, 'utf8'));
        totalRecords += count;
      } catch (error) {
        console.error(`Error exporting ${type}:`, error);
      }
    }

    const zipFileName = `motorpool_export_${new Date().toISOString().split('T')[0]}.zip`;
    const zipBuffer = zip.toBuffer();
    const base64Data = zipBuffer.toString('base64');

    // Save to export history (manual export)
    const exportRecord = await new ExportHistory({
      exportType: exportTypes.join(', '),
      fileName: zipFileName,
      recordCount: totalRecords,
      triggeredBy: 'manual',
      adminRole: 'motorpool',
      status: 'success',
      fileData: base64Data,
      fileSize: `${(zipBuffer.length / 1024).toFixed(2)} KB`
    }).save();

    res.json({
      message: 'Motorpool export successful',
      fileName: zipFileName,
      recordCount: totalRecords,
      downloadUrl: `data:application/zip;base64,${base64Data}`,
      exportId: exportRecord._id
    });
  } catch (error) {
    console.error('Error motorpool export:', error);
    res.status(500).json({ error: 'Failed to export motorpool data' });
  }
});

/**
 * POST /admin/configurations/manual-export-merchant
 * Manually trigger merchant export (multiple types as ZIP)
 */
router.post('/manual-export-merchant', async (req, res) => {
  try {
    const { exportTypes } = req.body;

    if (!exportTypes || !Array.isArray(exportTypes) || exportTypes.length === 0) {
      return res.status(400).json({ error: 'Export types array is required' });
    }

    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip();
    let totalRecords = 0;

    // Export each selected type and add to ZIP
    for (const type of exportTypes) {
      try {
        const { csv, count } = await exportByType(type);
        const fileName = `${type.toLowerCase()}_export_${new Date().toISOString().split('T')[0]}.csv`;
        zip.addFile(fileName, Buffer.from(csv, 'utf8'));
        totalRecords += count;
      } catch (error) {
        console.error(`Error exporting ${type}:`, error);
      }
    }

    const zipFileName = `merchant_export_${new Date().toISOString().split('T')[0]}.zip`;
    const zipBuffer = zip.toBuffer();
    const base64Data = zipBuffer.toString('base64');

    // Save to export history (manual export)
    const exportRecord = await new ExportHistory({
      exportType: exportTypes.join(', '),
      fileName: zipFileName,
      recordCount: totalRecords,
      triggeredBy: 'manual',
      adminRole: 'merchant',
      status: 'success',
      fileData: base64Data,
      fileSize: `${(zipBuffer.length / 1024).toFixed(2)} KB`
    }).save();

    res.json({
      message: 'Merchant export successful',
      fileName: zipFileName,
      recordCount: totalRecords,
      downloadUrl: `data:application/zip;base64,${base64Data}`,
      exportId: exportRecord._id
    });
  } catch (error) {
    console.error('Error merchant export:', error);
    res.status(500).json({ error: 'Failed to export merchant data' });
  }
});

/**
 * POST /admin/configurations/manual-export-treasury
 * Manually trigger treasury export (multiple types as ZIP)
 */
router.post('/manual-export-treasury', async (req, res) => {
  try {
    const { exportTypes, dateRange, customStartDate, customEndDate } = req.body;

    if (!exportTypes || !Array.isArray(exportTypes) || exportTypes.length === 0) {
      return res.status(400).json({ error: 'Export types array is required' });
    }

    // Prepare date filter
    const dateFilter = {};
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      dateFilter.startDate = customStartDate;
      dateFilter.endDate = customEndDate;
    } else if (dateRange === '24hr') {
      const now = new Date();
      dateFilter.startDate = new Date(now - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dateFilter.endDate = now.toISOString().split('T')[0];
    } else if (dateRange === 'week') {
      const now = new Date();
      dateFilter.startDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dateFilter.endDate = now.toISOString().split('T')[0];
    } else if (dateRange === 'month') {
      const now = new Date();
      dateFilter.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      dateFilter.endDate = now.toISOString().split('T')[0];
    }

    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip();
    let totalRecords = 0;

    // Map treasury export types to actual data types
    const typeMapping = {
      'Transactions': 'transactions',
      'Cash-Ins': 'cashins',
      'Users': 'users',
      'Balances': 'balances',
      'Logs': 'logs',
      'Concerns': 'concerns'
    };

    // Export each selected type and add to ZIP
    for (const type of exportTypes) {
      try {
        const actualType = typeMapping[type] || type.toLowerCase();
        const { csv, count } = await exportByType(actualType, dateFilter);
        const fileName = `${actualType}_export_${new Date().toISOString().split('T')[0]}.csv`;
        zip.addFile(fileName, Buffer.from(csv, 'utf8'));
        totalRecords += count;
      } catch (error) {
        console.error(`Error exporting ${type}:`, error);
      }
    }

    const zipFileName = `treasury_export_${new Date().toISOString().split('T')[0]}.zip`;
    const zipBuffer = zip.toBuffer();
    const base64Data = zipBuffer.toString('base64');

    // Save to export history (manual export)
    const exportRecord = await new ExportHistory({
      exportType: exportTypes.join(', '),
      fileName: zipFileName,
      recordCount: totalRecords,
      triggeredBy: 'manual',
      adminRole: 'treasury',
      status: 'success',
      fileData: base64Data,
      fileSize: `${(zipBuffer.length / 1024).toFixed(2)} KB`
    }).save();

    res.json({
      message: 'Treasury export successful',
      fileName: zipFileName,
      totalRecords,
      downloadUrl: `data:application/zip;base64,${base64Data}`,
      exportId: exportRecord._id
    });
  } catch (error) {
    console.error('Error treasury export:', error);
    res.status(500).json({ error: 'Failed to export treasury data' });
  }
});

/**
 * GET /admin/configurations/download-export/:id
 * Download a previously exported file by its export history ID
 */
router.get('/download-export/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find the export record
    const exportRecord = await ExportHistory.findById(id);

    if (!exportRecord) {
      return res.status(404).json({ error: 'Export not found' });
    }

    if (exportRecord.status !== 'success') {
      return res.status(400).json({ error: 'Export was not successful' });
    }

    // Check if file data exists in the record
    if (!exportRecord.fileData) {
      return res.status(404).json({ error: 'Export file data not found' });
    }

    // Return the download URL with file data
    res.json({
      fileName: exportRecord.fileName,
      downloadUrl: `data:application/zip;base64,${exportRecord.fileData}`,
      recordCount: exportRecord.recordCount,
      exportedAt: exportRecord.exportedAt
    });
  } catch (error) {
    console.error('Error downloading export:', error);
    res.status(500).json({ error: 'Failed to download export' });
  }
});

// ============================================================
// EXCUSE SLIPS ENDPOINTS
// ============================================================

/**
 * GET /admin/configurations/excuse-slips
 * Get recent excuse slips
 */
router.get('/excuse-slips', async (req, res) => {
  try {
    const slips = await ExcuseSlip.find()
      .sort({ issuedAt: -1 })
      .limit(100);
    res.json(slips);
  } catch (error) {
    console.error('Error fetching excuse slips:', error);
    res.status(500).json({ error: 'Failed to fetch excuse slips' });
  }
});

/**
 * POST /admin/configurations/excuse-slips
 * Issue a new excuse slip
 */
router.post('/excuse-slips', async (req, res) => {
  try {
    const { userId, driverId, shuttleId, routeId, routeName, delayMinutes, reason } = req.body;

    if (!userId || !driverId || !shuttleId || !delayMinutes || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get driver details
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Get excuse slip configuration
    const config = await Configuration.findOne({ configType: 'excuseSlips' });
    const validityHours = config?.excuseSlips?.validityHours || 24;

    // Create excuse slip
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + validityHours);

    const slip = new ExcuseSlip({
      userId,
      studentName: user.fullName,
      schoolId: user.schoolUId,
      driverId,
      driverName: `${driver.firstName} ${driver.lastName}`,
      shuttleId,
      routeId,
      routeName: routeName || '',
      delayMinutes,
      reason,
      expiresAt
    });

    await slip.save();

    // Send email to student
    try {
      await sendEmail({
        to: user.email,
        subject: 'NU Shuttle Service - Delay Excuse Slip',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1E2347;">NU Shuttle Service - Delay Excuse Slip</h2>
            <p>Dear ${user.fullName},</p>
            <p>This is to certify that you experienced a delay while using the NU Shuttle Service.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD41C;">
              <h3 style="margin-top: 0; color: #1E2347;">Delay Details:</h3>
              <p><strong>Slip Number:</strong> ${slip.slipNumber}</p>
              <p><strong>Date:</strong> ${new Date(slip.issuedAt).toLocaleString()}</p>
              <p><strong>Delay Duration:</strong> ${delayMinutes} minutes</p>
              <p><strong>Route:</strong> ${routeName || 'N/A'}</p>
              <p><strong>Shuttle ID:</strong> ${shuttleId}</p>
              <p><strong>Driver:</strong> ${slip.driverName}</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Verification Code:</strong> <span style="font-family: monospace; background: #fff; padding: 4px 8px; border-radius: 4px;">${slip.verificationCode}</span></p>
            </div>
            <p><strong>Validity:</strong> This slip is valid until ${new Date(expiresAt).toLocaleString()}</p>
            <p>Please present this slip to your professor or employer as proof of delay.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #666;">
              This is an official excuse slip issued by NU Shuttle Service. For verification, contact the NU Motorpool Office.
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send excuse slip email:', emailError);
    }

    res.status(201).json(slip);
  } catch (error) {
    console.error('Error creating excuse slip:', error);
    res.status(500).json({ error: 'Failed to create excuse slip' });
  }
});

/**
 * GET /admin/configurations/excuse-slips/:slipNumber/verify
 * Verify an excuse slip
 */
router.get('/excuse-slips/:slipNumber/verify', async (req, res) => {
  try {
    const { slipNumber } = req.params;
    const { verificationCode } = req.query;

    const slip = await ExcuseSlip.findOne({ slipNumber });
    if (!slip) {
      return res.status(404).json({ error: 'Excuse slip not found', valid: false });
    }

    // Check verification code if provided
    if (verificationCode && slip.verificationCode !== verificationCode.toUpperCase()) {
      return res.status(400).json({ error: 'Invalid verification code', valid: false });
    }

    // Check if expired
    const now = new Date();
    if (now > slip.expiresAt) {
      slip.status = 'expired';
      await slip.save();
      return res.json({ ...slip.toObject(), valid: false, reason: 'Slip has expired' });
    }

    // Check if voided
    if (slip.status === 'void') {
      return res.json({ ...slip.toObject(), valid: false, reason: 'Slip has been voided' });
    }

    res.json({ ...slip.toObject(), valid: true });
  } catch (error) {
    console.error('Error verifying excuse slip:', error);
    res.status(500).json({ error: 'Failed to verify excuse slip', valid: false });
  }
});

/**
 * PUT /admin/configurations/excuse-slips/:id/void
 * Void an excuse slip
 */
router.put('/excuse-slips/:id/void', async (req, res) => {
  try {
    const { id } = req.params;
    const slip = await ExcuseSlip.findByIdAndUpdate(
      id,
      { status: 'void' },
      { new: true }
    );

    if (!slip) {
      return res.status(404).json({ error: 'Excuse slip not found' });
    }

    res.json(slip);
  } catch (error) {
    console.error('Error voiding excuse slip:', error);
    res.status(500).json({ error: 'Failed to void excuse slip' });
  }
});

export default router;
