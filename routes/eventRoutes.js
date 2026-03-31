// ── EVENT ROUTES ──────────────────────────────────────────
// Handles Discovery, Registration, and Management of activity listings
const express = require('express');
const router = express.Router();
const {
    getAllEvents, getEventById, createEvent, updateEvent,
    registerForEvent, unregisterFromEvent, deleteEvent, markAttendance, getRecommendedEvents
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// ── PUBLIC ────────────────────────────────────────────────
// View all active events
router.get('/', getAllEvents);
// View recommended events for a logged-in student (MUST be above /:id)
router.get('/recommended', protect, getRecommendedEvents);
// View specific event details
router.get('/:id', getEventById);

// ── PROTECTED (REQUIRES LOGIN) ────────────────────────────
// Custom wrapper to catch Multer/Cloudinary errors
const handleUpload = (req, res, next) => {
  upload.single('poster')(req, res, (err) => {
    if (err) {
      console.error('Upload Error:', err.message);
      return res.status(400).json({
        message: 'Image upload failed. This usually happens if Cloudinary credentials in .env are missing or invalid.',
        error: err.message
      });
    }
    next();
  });
};

// Create new event (Only for Club Admins)
router.post('/', protect, authorize('clubAdmin'), handleUpload, createEvent);

// Update existing event details (Only for Club Admins)
router.put('/:id', protect, authorize('clubAdmin'), handleUpload, updateEvent);

// Sign up for an event (Upload requires 'paymentProof' for paid events)
router.post('/:id/register', protect, authorize('student'), upload.single('paymentProof'), registerForEvent);

// Scan QR code to mark attendance (Only for Club Admins)
router.post('/:id/attendance', protect, authorize('clubAdmin'), markAttendance);

// Cancel registration (Only for Students)
router.delete('/:id/register', protect, authorize('student'), unregisterFromEvent);

// Permamnently delete event (Club Admins or Super Admins only)
router.delete('/:id', protect, authorize('clubAdmin', 'superAdmin'), deleteEvent);

module.exports = router;
