// server/routes/leaderboard.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   GET api/leaderboard
// @desc    Get top 10 users by points
// @access  Public
router.get('/', async (req, res) => {
  try {
    const leaderboard = await User.find()
      .sort({ 'stats.points': -1 }) // Sort by points descending
      .limit(10)
      .select('username stats'); // Send username and all stats

    res.json(leaderboard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;