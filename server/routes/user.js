// nucash-server/routes/user.js
import express from 'express';
const router = express.Router();
import User from '../models/User.js';

router.get('/balance/:rfidUId', async (req, res) => {
  try {
    const u = await User.findOne({ rfidUId: req.params.rfidUId });
    if (!u) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      balance: u.balance,
      name: u.name,
      isActive: u.isActive
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// REMOVED: Dangerous seed route that deletes all users
// This was causing users to be wiped from the database
// If you need to seed test data, use the scripts in /server/scripts/ instead
// router.post('/seed', async (req, res) => { ... });

export default router;