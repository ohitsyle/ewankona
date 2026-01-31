// nucash-server/routes/admin.js
// FIXED: Added analytics dashboard endpoint and shuttle positions

import express from 'express';
const router = express.Router();
import Driver from '../models/Driver.js';
import Shuttle from '../models/Shuttle.js';
import Phone from '../models/Phone.js';
import Route from '../models/Route.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import EventLog from '../models/EventLog.js';
import UserConcern from '../models/UserConcern.js';
import Trip from '../models/Trip.js';
import { logAdminAction, logError } from '../utils/logger.js';

// Try to import ShuttlePosition (may not exist)
let ShuttlePosition = null;
import('../models/ShuttlePosition.js')
  .then(module => {
    ShuttlePosition = module.default;
    console.log('✅ ShuttlePosition model loaded');
  })
  .catch(() => {
    console.log('⚠️ ShuttlePosition model not found');
  });

// ============================================================
// ANALYTICS ENDPOINTS
// ============================================================

/**
 * GET /admin/analytics/dashboard
 * Dashboard statistics
 */
router.get('/analytics/dashboard', async (req, res) => {
  try {
    // Get total PASSENGERS (each payment = one passenger)
    const totalPassengers = await Transaction.countDocuments({
      transactionType: 'debit',
      shuttleId: { $ne: null },
      status: { $nin: ['Refunded', 'Failed'] }
    });

    // Get total TRIPS COMPLETED (from Trip model)
    const totalTripsCompleted = await Trip.countDocuments({
      status: 'completed'
    });

    // Get total collections (sum of NON-REFUNDED debits only)
    // We don't need to subtract refunds because refunded transactions are already excluded
    const debitsAgg = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'debit',
          shuttleId: { $ne: null },
          status: { $nin: ['Refunded', 'Failed'] } // Exclude refunded and failed
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCollections = debitsAgg.length > 0 ? debitsAgg[0].total : 0;

    // Get total refunds (for reporting purposes)
    const creditsAgg = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'credit',
          shuttleId: { $ne: null },
          transactionId: { $regex: /^RFD/ }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRefunds = creditsAgg.length > 0 ? creditsAgg[0].total : 0;

    // Get active shuttles count
    const activeShuttles = await Shuttle.countDocuments({ isActive: true });
    const shuttlesInUse = await Shuttle.countDocuments({ status: 'taken' });

    // Get today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's PASSENGERS (transaction count)
    const todayPassengers = await Transaction.countDocuments({
      transactionType: 'debit',
      shuttleId: { $ne: null },
      status: { $nin: ['Refunded', 'Failed'] },
      createdAt: { $gte: today }
    });

    // Today's TRIPS COMPLETED
    const todayTripsCompleted = await Trip.countDocuments({
      status: 'completed',
      arrivalTime: { $gte: today }
    });

    // Today's revenue (sum of NON-REFUNDED debits only)
    const todayRevenueAgg = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'debit',
          shuttleId: { $ne: null },
          status: { $nin: ['Refunded', 'Failed'] },
          createdAt: { $gte: today }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayRevenue = todayRevenueAgg.length > 0 ? todayRevenueAgg[0].total : 0;

    // Today's refunds (for reporting)
    const todayRefundsAgg = await Transaction.aggregate([
      {
        $match: {
          transactionType: 'credit',
          shuttleId: { $ne: null },
          transactionId: { $regex: /^RFD/ },
          createdAt: { $gte: today }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayRefunds = todayRefundsAgg.length > 0 ? todayRefundsAgg[0].total : 0;

    // Get active drivers count
    const activeDrivers = await Driver.countDocuments({ isActive: true });

    // Get total users
    const totalUsers = await User.countDocuments({ isActive: true });

    res.json({
      totalPassengers,          // Total passengers (transaction count)
      totalTripsCompleted,      // Total trips completed (from Trip model)
      totalRides: totalTripsCompleted, // Alias for backward compatibility
      totalCollections,         // Net revenue (debits - refunds)
      activeShuttles,
      shuttlesInUse,
      activeDrivers,
      totalUsers,
      today: {
        rides: todayTripsCompleted,    // Today's completed trips
        passengers: todayPassengers,   // Today's passengers
        revenue: todayRevenue          // Net revenue for today
      },
      refunds: {
        total: totalRefunds,
        today: todayRefunds
      }
    });
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/shuttle-positions
 * Get current positions of all shuttles in transit
 */
router.get('/shuttle-positions', async (req, res) => {
  try {
    // Get shuttles that are currently reserved or taken (assigned to drivers)
    const shuttlesInTransit = await Shuttle.find({ status: { $in: ['reserved', 'taken'] } });
    console.log(`📍 Found ${shuttlesInTransit.length} shuttles with status 'reserved' or 'taken'`);

    const positions = [];

    for (const shuttle of shuttlesInTransit) {
      // Get position from ShuttlePosition model
      let position = null;
      if (ShuttlePosition) {
        position = await ShuttlePosition.findOne({ shuttleId: shuttle.shuttleId })
          .sort({ updatedAt: -1 });
      }

      console.log(`🚐 ${shuttle.shuttleId}: GPS data = ${position ? `${position.latitude}, ${position.longitude}` : 'NONE'}`);

      // Skip shuttles without real GPS data
      if (!position || !position.latitude || !position.longitude) {
        console.log(`   ⚠️ Skipping ${shuttle.shuttleId} - no GPS data`);
        continue;
      }

      console.log(`   ✅ Including ${shuttle.shuttleId} in positions`);


      // Get active trip for this shuttle
      const Trip = (await import('../models/Trip.js')).default;
      const activeTrip = await Trip.findOne({
        shuttleId: shuttle.shuttleId,
        status: 'in_progress'
      }).sort({ departureTime: -1 });

      // Get route info if trip exists
      let routeInfo = null;
      if (activeTrip && activeTrip.routeId) {
        const Route = (await import('../models/Route.js')).default;
        routeInfo = await Route.findOne({ routeId: activeTrip.routeId });
      }

      positions.push({
        shuttleId: shuttle.shuttleId,
        driverName: shuttle.currentDriver,
        driverId: shuttle.currentDriverId,
        latitude: position.latitude,
        longitude: position.longitude,
        updatedAt: position.updatedAt,
        vehicleInfo: `${shuttle.vehicleType} ${shuttle.vehicleModel}`,
        // Trip and route information
        currentTrip: activeTrip ? {
          tripId: activeTrip.tripId || activeTrip._id,
          routeId: activeTrip.routeId,
          startLocationName: activeTrip.startLocationName,
          endLocationName: activeTrip.endLocationName,
          startLatitude: activeTrip.startLatitude,
          startLongitude: activeTrip.startLongitude,
          endLatitude: activeTrip.endLatitude,
          endLongitude: activeTrip.endLongitude
        } : null,
        route: routeInfo ? {
          routeId: routeInfo.routeId,
          routeName: routeInfo.routeName,
          fromName: routeInfo.fromName,
          toName: routeInfo.toName,
          toLatitude: routeInfo.toLatitude,
          toLongitude: routeInfo.toLongitude
        } : null
      });
    }

    res.json(positions);
  } catch (error) {
    console.error('❌ Shuttle positions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// DRIVERS CRUD
// ============================================================

router.get('/drivers', async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/drivers/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/drivers', async (req, res) => {
  try {
    const driver = new Driver(req.body);
    await driver.save();

    // Log admin action
    await logAdminAction({
      action: 'Driver Created',
      description: `created driver ${driver.driverId} (${driver.firstName} ${driver.lastName})`,
      adminId: req.adminId || 'system',
      targetEntity: 'driver',
      targetId: driver.driverId,
      changes: req.body
    });

    res.status(201).json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/drivers/:id', async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/drivers/:id', async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    // Log admin action
    await logAdminAction({
      action: 'Driver Deleted',
      description: `deleted driver ${driver.driverId} (${driver.firstName} ${driver.lastName})`,
      adminId: req.adminId || 'system',
      targetEntity: 'driver',
      targetId: driver.driverId,
      severity: 'warning'
    });

    res.json({ message: 'Driver deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// SHUTTLES CRUD
// ============================================================

router.get('/shuttles', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const shuttles = await Shuttle.find(filter).sort({ createdAt: -1 });
    res.json(shuttles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/shuttles/:id', async (req, res) => {
  try {
    const shuttle = await Shuttle.findById(req.params.id);
    if (!shuttle) return res.status(404).json({ error: 'Shuttle not found' });
    res.json(shuttle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/shuttles', async (req, res) => {
  try {
    const shuttle = new Shuttle(req.body);
    await shuttle.save();
    res.status(201).json(shuttle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/shuttles/:id', async (req, res) => {
  try {
    const shuttle = await Shuttle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!shuttle) return res.status(404).json({ error: 'Shuttle not found' });
    res.json(shuttle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/shuttles/:id', async (req, res) => {
  try {
    const shuttle = await Shuttle.findByIdAndDelete(req.params.id);
    if (!shuttle) return res.status(404).json({ error: 'Shuttle not found' });
    res.json({ message: 'Shuttle deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// PHONES CRUD
// ============================================================

router.get('/phones', async (req, res) => {
  try {
    // Motorpool admin only sees phones that are either:
    // 1. Not assigned to anyone (available)
    // 2. Assigned to drivers (has assignedDriverId)
    // 3. NOT assigned to merchants
    const phones = await Phone.find({
      $or: [
        { assignedDriverId: { $ne: null } }, // Assigned to a driver
        { $and: [ // Available (not assigned to anyone)
          { assignedDriverId: null },
          { assignedMerchantId: null }
        ]}
      ]
    }).sort({ createdAt: -1 });
    res.json(phones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/phones/:id', async (req, res) => {
  try {
    const phone = await Phone.findById(req.params.id);
    if (!phone) return res.status(404).json({ error: 'Phone not found' });
    res.json(phone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/phones', async (req, res) => {
  try {
    const phone = new Phone(req.body);
    await phone.save();
    res.status(201).json(phone);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/phones/:id', async (req, res) => {
  try {
    // Motorpool admin: If assigning to driver, clear merchant assignment
    const updateData = { ...req.body };
    if (updateData.assignedDriverId) {
      updateData.assignedMerchantId = null;
      updateData.assignedBusinessName = null;
      updateData.assignedMerchantDate = null;
    }

    const phone = await Phone.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!phone) return res.status(404).json({ error: 'Phone not found' });
    res.json(phone);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/phones/:id', async (req, res) => {
  try {
    const phone = await Phone.findByIdAndDelete(req.params.id);
    if (!phone) return res.status(404).json({ error: 'Phone not found' });
    res.json({ message: 'Phone deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROUTES CRUD
// ============================================================

router.get('/routes', async (req, res) => {
  try {
    const { active } = req.query;
    const filter = active === 'true' ? { isActive: true } : {};
    const routes = await Route.find(filter).sort({ createdAt: -1 });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/routes/:id', async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/routes', async (req, res) => {
  try {
    const route = new Route(req.body);
    await route.save();
    res.status(201).json(route);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/routes/:id', async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/routes/:id', async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json({ message: 'Route deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// EVENT LOGS
// ============================================================

router.get('/event-logs', async (req, res) => {
  try {
    const logs = await EventLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /admin/event-logs
 * Create a new event log
 */
router.post('/event-logs', async (req, res) => {
  try {
    const log = await EventLog.create(req.body);
    console.log(`✅ Event log created: ${log.eventType} - ${log.title}`);
    res.json({ success: true, log });
  } catch (error) {
    console.error('❌ Error creating event log:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// USER CONCERNS
// ============================================================

router.get('/user-concerns', async (req, res) => {
  try {
    const concerns = await UserConcern.find().sort({ submittedAt: -1 });
    res.json({ success: true, concerns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single concern by concernId or _id
router.get('/user-concerns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by concernId first, then by _id
    let concern = await UserConcern.findOne({ concernId: id });

    if (!concern) {
      concern = await UserConcern.findById(id);
    }

    if (!concern) {
      return res.status(404).json({ success: false, error: 'Concern not found' });
    }

    res.json({ success: true, concern });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/user-concerns/:id/status', async (req, res) => {
  try {
    const { status, resolution, adminName } = req.body;
    const { id } = req.params;

    // Require resolution when resolving
    if (status === 'resolved' && (!resolution || !resolution.trim())) {
      return res.status(400).json({
        success: false,
        error: 'A resolution message is required when resolving a concern'
      });
    }

    // Build update object
    const updateData = { status, updatedAt: new Date() };

    // If resolving, add resolution details
    if (status === 'resolved') {
      updateData.resolution = resolution;
      updateData.adminResponse = resolution;
      updateData.resolvedDate = new Date();
      updateData.resolvedBy = adminName || req.adminId || 'Admin';
      updateData.respondedDate = new Date();
    }

    // If marking as in_progress, record the timestamp
    if (status === 'in_progress') {
      updateData.inProgressDate = new Date();
    }

    // Try to find by concernId first, then by _id
    let concern = await UserConcern.findOneAndUpdate(
      { concernId: id },
      updateData,
      { new: true }
    );

    // If not found by concernId, try by _id
    if (!concern) {
      concern = await UserConcern.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
    }
    if (!concern) return res.status(404).json({ error: 'Concern not found' });

    // Log admin action
    await logAdminAction({
      action: 'Concern Status Updated',
      description: `updated concern ${concern.concernId} status to ${status}`,
      adminId: req.adminId || 'system',
      targetEntity: 'concern',
      targetId: concern.concernId,
      changes: { status, resolution }
    });

    // Send email notification when concern status changes
    if (status === 'in_progress' && concern.userEmail) {
      try {
        const { sendConcernInProgressEmail } = await import('../services/emailService.js');

        await sendConcernInProgressEmail(concern.userEmail, concern.userName || 'Valued User', {
          concernId: concern.concernId,
          subject: concern.subject || concern.selectedConcerns?.join(', ') || 'Your Concern',
          reportTo: concern.reportTo || 'NUCash Support'
        });

        console.log(`✉️ In-progress notification email sent to ${concern.userEmail}`);
      } catch (emailError) {
        console.error('Failed to send in-progress email:', emailError);
        // Don't fail the request if email fails
      }
    }

    if (status === 'resolved' && concern.userEmail) {
      try {
        const { sendConcernResolvedEmail } = await import('../services/emailService.js');

        await sendConcernResolvedEmail(concern.userEmail, concern.userName || 'Valued User', {
          concernId: concern.concernId,
          subject: concern.subject || concern.selectedConcerns?.join(', ') || 'Your Concern',
          reportTo: concern.reportTo || 'NUCash Support',
          adminReply: resolution,
          resolvedBy: adminName || 'Support Team'
        });

        console.log(`✉️ Resolution email sent to ${concern.userEmail}`);
      } catch (emailError) {
        console.error('Failed to send resolution email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({ success: true, concern, emailSent: status === 'resolved' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// TRIPS
// ============================================================

router.get('/trips', async (req, res) => {
  try {
    const trips = await Trip.find().sort({ departureTime: -1 }).limit(500);
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/trips/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /admin/trips/:id/notes
 * Add a note/comment to a trip
 */
router.post('/trips/:id/notes', async (req, res) => {
  try {
    const { content, adminId, adminName } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Add note to trip
    trip.notes = trip.notes || [];
    trip.notes.push({
      adminId: adminId || 'unknown',
      adminName: adminName || 'Admin',
      content: content.trim(),
      timestamp: new Date()
    });

    await trip.save();

    // Log admin action
    await logAdminAction({
      adminId: adminId || 'unknown',
      action: 'add_trip_note',
      entityType: 'trip',
      entityId: trip._id.toString(),
      details: { content: content.trim() }
    });

    console.log(`✅ Note added to trip ${trip._id} by ${adminName}`);

    res.json({
      success: true,
      trip: trip
    });
  } catch (error) {
    console.error('❌ Error adding trip note:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// SETTINGS ENDPOINTS
// ============================================================

/**
 * GET /admin/settings
 * Get all system settings
 */
router.get('/settings', async (req, res) => {
  try {
    // Return settings from local storage or default values
    // In a real system, these would be stored in the database
    const settings = {
      general: {
        systemName: 'NUCash Motorpool System',
        supportEmail: 'support@nucash.com',
        maintenanceMode: false
      },
      fare: {
        baseFare: 15,
        perKmRate: 5,
        currency: 'PHP'
      },
      shuttle: {
        maxCapacity: 20,
        autoAssignment: true,
        maintenanceAlertThreshold: 30
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        driverAlerts: true
      }
    };

    res.json(settings);
  } catch (error) {
    console.error('❌ Error loading settings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /admin/settings
 * Update a system setting
 */
router.put('/settings', async (req, res) => {
  try {
    const { section, key, value, adminId, adminName } = req.body;

    console.log(`⚙️ Setting updated: ${section}.${key} = ${value} by ${adminName}`);

    // Log the settings change
    await logAdminAction({
      adminId: adminId || 'unknown',
      action: 'update_setting',
      entityType: 'settings',
      entityId: `${section}.${key}`,
      details: { section, key, value, previousValue: null }
    });

    res.json({
      success: true,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating setting:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;