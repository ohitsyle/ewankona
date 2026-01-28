// nucash-server/routes/geofences.js
import express from 'express';
const router = express.Router();
import Geofence from '../models/Geofence.js';

router.get('/', async (req, res) => res.json(await Geofence.find({})));

router.post('/seed', async (req, res) => {
  await Geofence.deleteMany({});
  await Geofence.create({ 
    locationId: 'POINT_A', 
    name: 'NU Laguna Campus', 
    latitude: 14.19951, 
    longitude: 121.14660, 
    radius: 100 
  });
  await Geofence.create({ 
    locationId: 'POINT_B', 
    name: 'SM Calamba Terminal', 
    latitude: 14.21122, 
    longitude: 121.16599, 
    radius: 100 
  });
  res.json({ seeded: true });
});

export default router;