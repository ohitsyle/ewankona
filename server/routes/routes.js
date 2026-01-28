// nucash-server/routes/routes.js
// CORRECTED: Changed /routes to / since already mounted at /api/routes

import express from 'express';
const router = express.Router();
import Route from '../models/Route.js';

/**
 * GET /api/routes
 */
router.get('/', async (req, res) => {
  try {
    const routes = await Route.find({ isActive: true }).sort({ order: 1 });
    console.log(`✅ Fetched ${routes.length} routes`);
    res.json(routes);
  } catch (error) {
    console.error('❌ Error fetching routes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/routes/:routeId
 */
router.get('/:routeId', async (req, res) => {
  try {
    const route = await Route.findOne({ routeId: req.params.routeId });
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json(route);
  } catch (error) {
    console.error('❌ Error fetching route:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;