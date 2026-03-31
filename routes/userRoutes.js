// ── USER ROUTES ───────────────────────────────────────────
// General profile and dashboard-related data aggregation
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ── @GET /api/users/dashboard ─────────────────────────────
// Purpose: Aggregates all data needed for the student homepage
// (Registered events, club names, etc.)
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Fetch user and drill down into registered events to get the Club names too
    const user = await User.findById(req.user._id)
      .populate({
        path: 'registeredEvents',
        populate: { path: 'clubId', select: 'clubName' }
      });
      
    // Filter out any events that might have been deleted from DB but are still in array
    if (user && user.registeredEvents) {
      user.registeredEvents = user.registeredEvents.filter(ev => ev != null);
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

module.exports = router;
