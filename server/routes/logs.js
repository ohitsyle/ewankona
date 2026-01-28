// nucash-server/routes/logs.js
// FIXED: Uses correct EventLog schema field names (eventType, severity, etc.)
// Event logging system for motorpool admin

import express from 'express';
const router = express.Router();
import EventLog from '../models/EventLog.js';

// ID generator for logs
const generateEventId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EVT${timestamp}${random}`;
};

/**
 * Helper function to log events
 * @param {string} eventType - Type of event (payment, login, logout, etc.)
 * @param {string} title - Short title for the event
 * @param {object} options - Additional options (description, severity, userId, driverId, adminId, adminName, etc.)
 */
const logEvent = async (eventType, title, options = {}) => {
  try {
    const {
      description = '',
      severity = 'info',
      userId = null,
      driverId = null,
      driverName = null,
      adminId = null,
      adminName = null,
      shuttleId = null,
      routeId = null,
      tripId = null,
      ipAddress = null,
      location = null,
      metadata = {}
    } = options;

    const log = new EventLog({
      eventId: generateEventId(),
      eventType,
      title,
      description,
      severity,
      userId,
      driverId,
      driverName,
      adminId,
      adminName,
      shuttleId,
      routeId,
      tripId,
      ipAddress,
      location,
      metadata,
      timestamp: new Date()
    });

    await log.save();

    // Enhanced console logging with actor information
    const actor = adminName || driverName || userId || 'System';
    const location_info = ipAddress ? ` from ${ipAddress}` : '';
    console.log(`📝 [${eventType.toUpperCase()}] ${actor}: ${title}${location_info}`);

    return log;
  } catch (error) {
    console.error('❌ Error logging event:', error);
    return null;
  }
};

/**
 * GET /api/logs
 * Get all event logs with filtering
 * FIXED: Uses correct field names from EventLog schema
 */
router.get('/', async (req, res) => {
  try {
    const { 
      type,           // Maps to eventType
      eventType,      // Direct match
      severity,
      userId,
      driverId,
      shuttleId,
      startDate, 
      endDate,
      limit = 100,
      page = 1
    } = req.query;
    
    const query = {};
    
    // FIXED: Use eventType field (not type)
    const filterType = eventType || type;
    if (filterType && filterType !== 'all') {
      query.eventType = filterType;
    }
    
    // Filter by severity
    if (severity && severity !== 'all') {
      query.severity = severity;
    }
    
    // Filter by userId
    if (userId) {
      query.userId = userId;
    }
    
    // Filter by driverId
    if (driverId) {
      query.driverId = driverId;
    }
    
    // Filter by shuttleId
    if (shuttleId) {
      query.shuttleId = shuttleId;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await EventLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await EventLog.countDocuments(query);
    
    // FIXED: Return data in format expected by admin dashboard
    res.json({
      logs: logs.map(log => ({
        _id: log._id,
        eventId: log.eventId,
        eventType: log.eventType,
        type: log.eventType, // Alias for backwards compatibility
        title: log.title,
        description: log.description,
        severity: log.severity,
        userId: log.userId,
        driverId: log.driverId,
        shuttleId: log.shuttleId,
        routeId: log.routeId,
        tripId: log.tripId,
        metadata: log.metadata,
        timestamp: log.timestamp,
        createdAt: log.createdAt
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error getting logs:', error);
    res.status(500).json({ 
      error: 'Failed to get logs',
      message: error.message,
      logs: [],
      pagination: { total: 0, page: 1, limit: 100, pages: 0 }
    });
  }
});

/**
 * POST /api/logs
 * Create new log entry
 * FIXED: Uses correct field names
 */
router.post('/', async (req, res) => {
  try {
    const { 
      type,       // Legacy field name
      eventType,  // New field name
      title,
      message,    // Legacy field name
      description,
      severity = 'info',
      userId,
      driverId,
      shuttleId,
      routeId,
      metadata 
    } = req.body;
    
    const log = await logEvent(
      eventType || type || 'system',
      title || message || 'Event logged',
      {
        description: description || message || '',
        severity,
        userId,
        driverId,
        shuttleId,
        routeId,
        metadata
      }
    );
    
    if (log) {
      res.json({ success: true, message: 'Log created', log });
    } else {
      res.status(500).json({ success: false, message: 'Failed to create log' });
    }
  } catch (error) {
    console.error('❌ Error creating log:', error);
    res.status(500).json({ 
      error: 'Failed to create log',
      message: error.message 
    });
  }
});

/**
 * GET /api/logs/stats
 * Get log statistics
 * FIXED: Groups by eventType (not type)
 */
router.get('/stats', async (req, res) => {
  try {
    // Group by eventType
    const byType = await EventLog.aggregate([
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Group by severity
    const bySeverity = await EventLog.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Today's logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogs = await EventLog.countDocuments({
      timestamp: { $gte: today }
    });
    
    // Total logs
    const totalLogs = await EventLog.countDocuments();
    
    // Recent errors
    const recentErrors = await EventLog.countDocuments({
      severity: { $in: ['error', 'critical'] },
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      byType,
      bySeverity,
      todayTotal: todayLogs,
      totalLogs,
      recentErrors
    });
  } catch (error) {
    console.error('❌ Error getting log stats:', error);
    res.status(500).json({ 
      error: 'Failed to get log statistics',
      message: error.message 
    });
  }
});

/**
 * GET /api/logs/recent
 * Get recent logs (shorthand)
 */
router.get('/recent', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const logs = await EventLog.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json(logs);
  } catch (error) {
    console.error('❌ Error getting recent logs:', error);
    res.status(500).json({ 
      error: 'Failed to get recent logs',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/logs/old
 * Delete logs older than specified days
 */
router.delete('/old', async (req, res) => {
  try {
    const { days = 90 } = req.query;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const result = await EventLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} old logs` 
    });
  } catch (error) {
    console.error('❌ Error deleting old logs:', error);
    res.status(500).json({ 
      error: 'Failed to delete old logs',
      message: error.message 
    });
  }
});

// Export router as default and logEvent as named export
export default router;
export { logEvent };