// nucash-server/routes/index.js
// ES6 router aggregator for all API routes
// UPDATED: Added adminAuth routes

import express from 'express';
const router = express.Router();

// Import all route modules
import login from './login.js';
import driver from './driver.js';
import merchant from './merchant.js';
import system from './system.js';
import geofences from './geofences.js';
import user from './user.js';
import shuttle from './shuttle.js';
import admin from './admin.js';
import adminAuth from './adminAuth.js'; // NEW: Admin authentication
import trips from './trips.js';
import routes from './routes.js';
import shuttles from './shuttles.js';
import analytics from './analytics.js';
import logs, { logEvent } from './logs.js';

// Mobile app routes
router.use('/login', login);
router.use('/driver', driver);
router.use('/merchant', merchant);
router.use('/system', system);
router.use('/geofences', geofences);
router.use('/user', user);
router.use('/shuttle', shuttle);

// NOTE: Admin routes are mounted directly in server.js at /api/admin
// This avoids conflicts and gives better control over admin endpoints

// Additional routes for admin features
router.use('/trips', trips);
router.use('/routes', routes);
router.use('/shuttles', shuttles);
router.use('/analytics', analytics);
router.use('/logs', logs);

export default router;
export { logEvent };