// server/jobs/autoExportCron.js
// Cron job for automated exports based on configuration
//
// IMPORTANT: This job is READ-ONLY for all data. It only:
// - Reads Configuration (autoExport settings)
// - Reads export data via exportByType() (Drivers, Routes, Trips, etc. - no deletes/updates)
// - Writes to ExportHistory (export metadata and file data)
// It does NOT modify or delete User, Admin, or any auth/account data.

import cron from 'node-cron';
import Configuration from '../models/Configuration.js';
import ExportHistory from '../models/ExportHistory.js';
import { sendEmail } from '../services/emailService.js';
// csvExporter (and thus User) is NOT imported here - loaded only when an export actually runs (see processAutoExport)

/**
 * Process auto-export for a specific role
 */
async function processAutoExport(role) {
  try {
    console.log(`[Auto-Export] Starting auto-export for ${role} role...`);

    // Find the auto-export configuration for this role
    const config = await Configuration.findOne({
      configType: 'autoExport',
      adminRole: role
    });

    if (!config || !config.autoExport || !config.autoExport.enabled) {
      console.log(`[Auto-Export] Auto-export disabled for ${role} role`);
      return;
    }

    const { exportTypes, emailRecipients } = config.autoExport;

    if (!exportTypes || exportTypes.length === 0) {
      console.log(`[Auto-Export] No export types selected for ${role} role`);
      return;
    }

    console.log(`[Auto-Export] Exporting types for ${role}:`, exportTypes);

    // Load csvExporter only when we actually run an export (avoids touching User model during "check" only)
    const { exportByType } = await import('../utils/csvExporter.js');

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
        console.log(`[Auto-Export] Exported ${count} ${type} records`);
      } catch (error) {
        console.error(`[Auto-Export] Error exporting ${type}:`, error);
      }
    }

    const zipFileName = `${role}_auto_export_${new Date().toISOString().split('T')[0]}.zip`;
    const zipBuffer = zip.toBuffer();
    const base64Data = zipBuffer.toString('base64');

    // Save to export history (automatic export)
    const exportRecord = await new ExportHistory({
      exportType: exportTypes.join(', '),
      fileName: zipFileName,
      recordCount: totalRecords,
      triggeredBy: 'automatic',
      adminRole: role,
      adminName: 'System',
      status: 'success',
      fileData: base64Data,
      fileSize: `${(zipBuffer.length / 1024).toFixed(2)} KB`
    }).save();

    console.log(`[Auto-Export] Successfully exported ${totalRecords} records for ${role}`);

    // Send email to recipients if configured
    if (emailRecipients && emailRecipients.length > 0) {
      try {
        await sendEmail({
          to: emailRecipients,
          subject: `NUCash Auto-Export (${role.toUpperCase()}) - ${new Date().toLocaleDateString()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1E2347;">Automated Data Export</h2>
              <p>Your scheduled ${role} data export has been completed.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Export Details:</h3>
                <p><strong>Export Types:</strong> ${exportTypes.join(', ')}</p>
                <p><strong>Total Records:</strong> ${totalRecords}</p>
                <p><strong>File Name:</strong> ${zipFileName}</p>
                <p><strong>File Size:</strong> ${(zipBuffer.length / 1024).toFixed(2)} KB</p>
                <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>You can download this export from the admin dashboard under Settings → Scheduled Export Archive.</p>
            </div>
          `
        });
        console.log(`[Auto-Export] Email sent to ${emailRecipients.join(', ')}`);
      } catch (emailError) {
        console.error('[Auto-Export] Failed to send email:', emailError);
      }
    }
  } catch (error) {
    console.error(`[Auto-Export] Error processing auto-export for ${role}:`, error);

    // Log failed export
    await new ExportHistory({
      exportType: 'Auto Export',
      fileName: '',
      status: 'failed',
      errorMessage: error.message,
      triggeredBy: 'automatic',
      adminRole: role,
      adminName: 'System'
    }).save();
  }
}

/**
 * Check and process auto-exports for all roles
 */
async function checkAndProcessAutoExports() {
  try {
    console.log('[Auto-Export] Checking for scheduled exports...');

    // Diagnostic: log User count before any other DB work (helps debug "user disappears after this message")
    try {
      const User = (await import('../models/User.js')).default;
      const countBefore = await User.countDocuments();
      console.log(`[Auto-Export] User count before check: ${countBefore}`);
    } catch (e) {
      console.log('[Auto-Export] (Could not log user count:', e.message, ')');
    }

    const configs = await Configuration.find({ configType: 'autoExport' });

    // Diagnostic: log User count after Configuration.find (if count dropped, something in this path removed a user)
    try {
      const User = (await import('../models/User.js')).default;
      const countAfter = await User.countDocuments();
      console.log(`[Auto-Export] User count after check: ${countAfter}`);
    } catch (e) {
      console.log('[Auto-Export] (Could not log user count:', e.message, ')');
    }

    for (const config of configs) {
      if (config.autoExport && config.autoExport.enabled) {
        const { frequency, time, dayOfWeek, dayOfMonth } = config.autoExport;
        const currentTime = new Date();
        const currentHour = currentTime.getHours().toString().padStart(2, '0');
        const currentMinute = currentTime.getMinutes().toString().padStart(2, '0');
        const currentDay = currentTime.getDay();
        const currentDate = currentTime.getDate();
        const configuredTime = time || '00:00';
        const [configHour, configMinute] = configuredTime.split(':');

        // Check if current time matches configured time (within 1-minute window)
        const timeMatches = currentHour === configHour && currentMinute === configMinute;

        if (!timeMatches) {
          continue;
        }

        // Check frequency
        let shouldExport = false;

        if (frequency === 'daily') {
          shouldExport = true;
        } else if (frequency === 'weekly' && currentDay === (dayOfWeek || 0)) {
          shouldExport = true;
        } else if (frequency === 'monthly' && currentDate === (dayOfMonth || 1)) {
          shouldExport = true;
        }

        if (shouldExport) {
          await processAutoExport(config.adminRole || 'motorpool');
        }
      }
    }
  } catch (error) {
    console.error('[Auto-Export] Error in checkAndProcessAutoExports:', error);
  }
}

/**
 * Initialize auto-export cron job
 * Runs every minute to check for scheduled exports
 */
export function initializeAutoExportCron() {
  console.log('[Auto-Export] Initializing auto-export cron job...');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    await checkAndProcessAutoExports();
  });

  console.log('[Auto-Export] Cron job scheduled to run every minute');
}
