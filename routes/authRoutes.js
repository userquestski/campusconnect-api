// ── AUTH ROUTES ───────────────────────────────────────────
// Handles endpoints for Registration, Login, and User Profiles
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, updateInterests, updateProfile, seedAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ── INPUT VALIDATION ───────────────────────────────────────
// Ensures incoming data meets format requirements before reaching controllers
const registerValidator = [
    body('name')
        .trim().notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
    body('email')
        .trim().isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidator = [
    body('email').trim().isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
];

// ── ROUTE MAPPINGS ────────────────────────────────────────
// POST: create local account
router.post('/register', registerValidator, register);

// POST: authenticate user and get token
router.post('/login', loginValidator, login);

// GET: one-time seed for admin (publicly accessible once to fix fresh deployments)
router.get('/seed-admin', seedAdmin);

// GET: get current user info (requires "protect" token verification)
router.get('/me', protect, getMe);

// PUT: update student interests
router.put('/update-interests', protect, updateInterests);

// PUT: change profile display details
router.put('/update-profile', protect, updateProfile);

module.exports = router;
