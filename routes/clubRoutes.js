// ── CLUB ROUTES ───────────────────────────────────────────
// Endpoints for Club Discovery, Following, and Admin Dashboards
const express = require('express');
const router  = express.Router();
const { 
  getAllClubs, getClubById, createClub, updateClub, getMyClub,
  followClub, unfollowClub, createAnnouncement, getAnnouncementsFeed
} = require('../controllers/clubController');
const { protect, authorize, softProtect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// ── CLUB ADMIN & STUDENT SPECIAL ROUTES (Must be above /:id) ──
// View own club's private dashboard (Requires Club Admin)
router.get('/my-club',   protect, authorize('clubAdmin'), getMyClub);

// Get personalized social feed of followed club posts (Requires Student)
router.get('/announcements/feed', protect, authorize('student'), getAnnouncementsFeed);

// ── PUBLIC ────────────────────────────────────────────────
// List all approved clubs
router.get('/', softProtect, getAllClubs);
// Details of a single club
router.get('/:id', softProtect, getClubById);

// ── STUDENT FEATURES ──────────────────────────────────────
// Follow a club for updates (Requires Student login)
router.post('/:id/follow', protect, authorize('student'), followClub);
// Unfollow a club
router.delete('/:id/follow', protect, authorize('student'), unfollowClub);

// ── CLUB ADMIN FEATURES ───────────────────────────────────
// Register a new club profile
router.post('/',         protect, authorize('clubAdmin'), upload.single('logo'), createClub);
// Edit club profile or gallery
router.put('/:id',       protect, authorize('clubAdmin'), updateClub);
// Post a new announcement update to followers
router.post('/:id/announcements', protect, authorize('clubAdmin'), createAnnouncement);

module.exports = router;
