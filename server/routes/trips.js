// nucash-server/routes/trips.js
// NEW: Trip management for complete route tracking

import express from 'express';
const router = express.Router();
import Trip from '../models/Trip.js';
import Driver from '../models/Driver.js';
import { logTripStart, logTripEnd, logError } from '../utils/logger.js';

/**
 * POST /trips/start
 * Start a new trip
 */
router.post('/start', async (req, res) => {
  try {
    const {
      shuttleId,
      driverId,
      routeId,
      startLatitude,
      startLongitude,
      startLocationName,
      endLatitude,
      endLongitude,
      endLocationName
    } = req.body;

    // Fetch driver name
    let driverName = '';
    try {
      const driver = await Driver.findOne({ driverId });
      if (driver) {
        driverName = driver.name || '';
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch driver name:', err.message);
    }

    const trip = await Trip.create({
      shuttleId,
      driverId,
      driverName,
      routeId,
      startLatitude,
      startLongitude,
      startLocationName: startLocationName || '',
      endLatitude,
      endLongitude,
      endLocationName: endLocationName || '',
      status: 'in_progress',
      departureTime: new Date()
    });

    console.log('✅ Trip started:', trip.tripId || trip._id, 'by', driverName);

    res.json({
      success: true,
      tripId: trip._id,
      trip: trip
    });
  } catch (error) {
    console.error('❌ Error starting trip:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /trips/:tripId/end
 * End a trip
 */
router.put('/:tripId/end', async (req, res) => {
  try {
    const { passengerCount, totalCollections, distanceTraveledKm } = req.body;

    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    trip.arrivalTime = new Date();
    trip.passengerCount = passengerCount || 0;
    trip.totalCollections = totalCollections || 0;
    trip.distanceTraveledKm = distanceTraveledKm || null;
    trip.status = 'completed';
    await trip.save();

    // Log trip end
    await logTripEnd({
      tripId: trip._id.toString(),
      shuttleId: trip.shuttleId,
      driverId: trip.driverId,
      routeId: trip.routeId,
      passengerCount: trip.passengerCount,
      totalCollections: trip.totalCollections,
      distanceTraveledKm: trip.distanceTraveledKm,
      durationMinutes: trip.durationMinutes,
      arrivalTime: trip.arrivalTime
    });

    console.log('✅ Trip ended:', trip.tripId || trip._id, '-', passengerCount, 'passengers');

    res.json({
      success: true,
      trip: trip
    });
  } catch (error) {
    console.error('❌ Error ending trip:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /trips/active/:driverId
 * Get active trip for driver
 */
router.get('/active/:driverId', async (req, res) => {
  try {
    const trip = await Trip.findOne({
      driverId: req.params.driverId,
      status: 'in_progress'
    });

    if (!trip) {
      return res.status(404).json({ error: 'No active trip found' });
    }

    res.json(trip);
  } catch (error) {
    console.error('❌ Error fetching active trip:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
