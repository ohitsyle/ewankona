// nucash-server/routes/shuttles.js
// FIXED: Proper shuttle assignment with driver name, and release on route end

import express from 'express';
const router = express.Router();
import Shuttle from '../models/Shuttle.js';
import Driver from '../models/Driver.js';

/**
 * GET /api/shuttles/available
 * Get all active shuttles (shows available and taken)
 */
router.get('/available', async (req, res) => {
  try {
    const shuttles = await Shuttle.find({ isActive: true });
    
    console.log(`🚐 Fetched ${shuttles.length} shuttles`);
    res.json(shuttles);
  } catch (error) {
    console.error('❌ Error fetching shuttles:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shuttles/assign
 * Reserve a shuttle for a driver (marks shuttle as 'reserved', not 'taken')
 * Status will change to 'taken' when driver clicks "Begin Route"
 */
router.post('/assign', async (req, res) => {
  try {
    const { shuttleId, driverId } = req.body;

    if (!shuttleId || !driverId) {
      return res.status(400).json({ error: 'shuttleId and driverId are required' });
    }

    // Get driver info
    const driver = await Driver.findOne({ driverId });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if driver already has a shuttle assigned or reserved
    const existingAssignment = await Shuttle.findOne({
      currentDriverId: driverId,
      status: { $in: ['taken', 'reserved'] }
    });
    if (existingAssignment) {
      return res.status(400).json({
        error: 'You already have a shuttle assigned',
        assignedShuttle: existingAssignment.shuttleId
      });
    }

    // Check if shuttle exists and is available
    const shuttle = await Shuttle.findOne({ shuttleId });
    if (!shuttle) {
      return res.status(404).json({ error: 'Shuttle not found' });
    }

    if (shuttle.status === 'taken' || shuttle.status === 'reserved') {
      return res.status(400).json({
        error: 'Shuttle is already in use',
        currentDriver: shuttle.currentDriver
      });
    }

    if (shuttle.status === 'unavailable') {
      return res.status(400).json({
        error: 'Shuttle is currently unavailable for use'
      });
    }

    // Reserve shuttle for driver (not 'taken' yet - that happens when route starts)
    shuttle.status = 'reserved';
    // Manually construct full name instead of using virtual
    const driverFullName = `${driver.firstName} ${driver.middleInitial ? driver.middleInitial + '. ' : ''}${driver.lastName}`.trim();
    shuttle.currentDriver = driverFullName;
    shuttle.currentDriverId = driverId;
    shuttle.updatedAt = new Date();
    await shuttle.save();

    // Also update driver's shuttleId field
    driver.shuttleId = shuttleId;
    await driver.save();

    console.log(`✅ Shuttle ${shuttleId} reserved by ${driverFullName}`);

    res.json({
      success: true,
      shuttle: shuttle,
      message: `Shuttle reserved for ${driver.fullName}`
    });
  } catch (error) {
    console.error('❌ Error assigning shuttle:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shuttles/start-route
 * Mark shuttle as 'taken' when driver clicks "Begin Route"
 */
router.post('/start-route', async (req, res) => {
  try {
    const { shuttleId, driverId } = req.body;

    if (!shuttleId || !driverId) {
      return res.status(400).json({ error: 'shuttleId and driverId are required' });
    }

    const shuttle = await Shuttle.findOne({ shuttleId });
    if (!shuttle) {
      return res.status(404).json({ error: 'Shuttle not found' });
    }

    // Verify the driver is the one who reserved this shuttle
    if (shuttle.currentDriverId !== driverId) {
      return res.status(403).json({
        error: 'You are not assigned to this shuttle'
      });
    }

    // Mark shuttle as taken (route started)
    shuttle.status = 'taken';
    shuttle.updatedAt = new Date();
    await shuttle.save();

    console.log(`✅ Shuttle ${shuttleId} route started by ${shuttle.currentDriver}`);

    res.json({
      success: true,
      shuttle: shuttle,
      message: 'Route started successfully'
    });
  } catch (error) {
    console.error('❌ Error starting route:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shuttles/release
 * Release a shuttle (marks shuttle as 'available')
 * Called when driver ends route or logs out
 */
router.post('/release', async (req, res) => {
  try {
    const { shuttleId, driverId } = req.body;

    if (!shuttleId) {
      return res.status(400).json({ error: 'shuttleId is required' });
    }
    
    const shuttle = await Shuttle.findOne({ shuttleId });
    if (!shuttle) {
      return res.status(404).json({ error: 'Shuttle not found' });
    }

    // Verify the driver is the one who has this shuttle
    if (driverId && shuttle.currentDriverId !== driverId) {
      return res.status(403).json({ 
        error: 'You are not assigned to this shuttle',
        currentDriver: shuttle.currentDriver
      });
    }
    
    // Release shuttle
    const previousDriver = shuttle.currentDriver;
    const previousDriverId = shuttle.currentDriverId;
    
    shuttle.status = 'available';
    shuttle.currentDriver = null;
    shuttle.currentDriverId = null;
    shuttle.updatedAt = new Date();
    await shuttle.save();
    
    // Also clear driver's shuttleId field
    if (previousDriverId) {
      const driver = await Driver.findOne({ driverId: previousDriverId });
      if (driver) {
        driver.shuttleId = null;
        await driver.save();
      }
    }
    
    console.log(`✅ Shuttle ${shuttleId} released from ${previousDriver}`);
    
    res.json({
      success: true,
      message: 'Shuttle released successfully',
      previousDriver: previousDriver,
      shuttle: shuttle
    });
  } catch (error) {
    console.error('❌ Error releasing shuttle:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shuttles/release-by-driver
 * Release any shuttle assigned to a specific driver
 * Useful for logout scenarios
 */
router.post('/release-by-driver', async (req, res) => {
  try {
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ error: 'driverId is required' });
    }
    
    // Find shuttle assigned to this driver (either reserved or taken)
    const shuttle = await Shuttle.findOne({
      currentDriverId: driverId,
      status: { $in: ['taken', 'reserved'] }
    });

    if (!shuttle) {
      return res.json({
        success: true,
        message: 'No shuttle was assigned to this driver'
      });
    }
    
    // Release shuttle
    const shuttleId = shuttle.shuttleId;
    shuttle.status = 'available';
    shuttle.currentDriver = null;
    shuttle.currentDriverId = null;
    shuttle.updatedAt = new Date();
    await shuttle.save();
    
    // Clear driver's shuttleId
    const driver = await Driver.findOne({ driverId });
    if (driver) {
      driver.shuttleId = null;
      await driver.save();
    }
    
    console.log(`✅ Shuttle ${shuttleId} released (driver logout)`);
    
    res.json({
      success: true,
      message: 'Shuttle released successfully',
      shuttleId: shuttleId
    });
  } catch (error) {
    console.error('❌ Error releasing shuttle by driver:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shuttles/status/:shuttleId
 * Get current status of a specific shuttle
 */
router.get('/status/:shuttleId', async (req, res) => {
  try {
    const shuttle = await Shuttle.findOne({ shuttleId: req.params.shuttleId });
    
    if (!shuttle) {
      return res.status(404).json({ error: 'Shuttle not found' });
    }
    
    res.json({
      shuttleId: shuttle.shuttleId,
      status: shuttle.status,
      currentDriver: shuttle.currentDriver,
      currentDriverId: shuttle.currentDriverId,
      vehicleInfo: `${shuttle.vehicleType} ${shuttle.vehicleModel}`,
      plateNumber: shuttle.plateNumber,
      capacity: shuttle.capacity
    });
  } catch (error) {
    console.error('❌ Error fetching shuttle status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shuttles/my-shuttle/:driverId
 * Get the shuttle currently assigned to a driver
 */
router.get('/my-shuttle/:driverId', async (req, res) => {
  try {
    const shuttle = await Shuttle.findOne({
      currentDriverId: req.params.driverId,
      status: { $in: ['taken', 'reserved'] }
    });

    if (!shuttle) {
      return res.json({ assigned: false, shuttle: null });
    }
    
    res.json({
      assigned: true,
      shuttle: {
        shuttleId: shuttle.shuttleId,
        vehicleType: shuttle.vehicleType,
        vehicleModel: shuttle.vehicleModel,
        plateNumber: shuttle.plateNumber,
        capacity: shuttle.capacity
      }
    });
  } catch (error) {
    console.error('❌ Error fetching driver shuttle:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shuttles/all
 * Get all shuttles with statistics
 */
router.get('/all', async (req, res) => {
  try {
    const shuttles = await Shuttle.find({});
    
    res.json({
      total: shuttles.length,
      available: shuttles.filter(s => s.status === 'available').length,
      taken: shuttles.filter(s => s.status === 'taken').length,
      unavailable: shuttles.filter(s => s.status === 'unavailable').length,
      shuttles: shuttles
    });
  } catch (error) {
    console.error('❌ Error fetching all shuttles:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;