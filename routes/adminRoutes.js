// ── ADMIN ROUTES ──────────────────────────────────────────
// High-level management tools only accessible by Super Admins
const express = require('express');
const router  = express.Router();
const { getPublicStats, getAnalytics, getPendingClubs, approveClub, deleteClub, getAllUsers, deleteUser, getAllEvents, deleteEvent } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ── PUBLIC ──────────────────────────────────────────────
router.get('/public-stats', getPublicStats);

// ── SECURITY GATE ─────────────────────────────────────────
// Every route below this line requires both a valid login (protect)
// and the specific permission level of 'superAdmin'
router.use(protect, authorize('superAdmin'));

// ── ANALYTICS & MONITORING ────────────────────────────────
router.get('/analytics',          getAnalytics);

// ── MODERATION: CLUBS ─────────────────────────────────────
router.get('/pending-clubs',      getPendingClubs);
router.put('/approve-club/:id',   approveClub);
router.delete('/clubs/:id',       deleteClub);

// ── MODERATION: USERS & EVENTS ────────────────────────────
router.get('/users',              getAllUsers);
router.delete('/users/:id',       deleteUser);
router.get('/events',             getAllEvents);
router.delete('/events/:id',      deleteEvent);

module.exports = router;
