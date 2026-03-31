// ── NOTIFICATION ROUTES ──────────────────────────────────
// Handles fetching and clearing in-app alerts
const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// ── PROTECTED (REQUIRES LOGIN) ────────────────────────────
// Fetch recent alerts for the logged-in student
router.get('/', protect, getNotifications);

// Bulk action to mark all alerts as seen
router.put('/read-all', protect, markAllAsRead);

// Mark a single specific alert as seen
router.put('/:id/read', protect, markAsRead);

module.exports = router;
