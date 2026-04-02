// ── AUTH CONTROLLER ──────────────────────────────────────
// Manages User Registration, Login, and Profile updates
const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// ── @POST /api/auth/register ──────────────────────────────
// Purpose: Creates a new user account in the system
const register = async (req, res) => {
  // Check for validation errors from express-validator (e.g., weak password)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { name, email, password, role, interests } = req.body;

    // SECURITY: Prevent users from making themselves 'superAdmin' via public API
    // Only 'student' and 'clubAdmin' are allowed to be created through this route.
    const allowedPublicRoles = ['student', 'clubAdmin'];
    const safeRole = allowedPublicRoles.includes(role) ? role : 'student';

    // Verify if the email is already in use
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Save the new user (the password is hashed automatically by the model's pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: safeRole,
      interests: Array.isArray(interests) ? interests : [],
    });

    // Send back the user details and a secure session token
    res.status(201).json({
      message: 'Account created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
      },
      token: generateToken(user._id),
    });

  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// ── @POST /api/auth/login ─────────────────────────────────
// Purpose: Authenticates existing users and provides a session token
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { email, password } = req.body;

    // Find user by email and explicitly include the hidden password field for verification
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare the plain text password with the hashed one in the database
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Successful login: provide user data and a new JWT
    res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
        avatar: user.avatar,
      },
      token: generateToken(user._id),
    });

  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// ── @GET /api/auth/me ─────────────────────────────────────
// Purpose: Retrieves the currently logged-in user's profile
const getMe = async (req, res) => {
  try {
    // Find the user by the ID embedded in the JWT token (added by Protect middleware)
    const user = await User.findById(req.user._id).populate('registeredEvents');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};

// ── @PUT /api/auth/update-interests ──────────────────────
// Purpose: Allows students to change the categories of events they are interested in
const updateInterests = async (req, res) => {
  try {
    const { interests } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { interests },
      { new: true } // Returns the updated document instead of the old one
    );
    res.json({ message: 'Interests updated', interests: user.interests });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// ── @PUT /api/auth/update-profile ────────────────────────
// Purpose: Edits personal details like name, phone, and department
const updateProfile = async (req, res) => {
  try {
    const { name, avatar, phone, rollNo, department } = req.body;
    const updates = {};
    
    // Only apply updates for provided fields
    if (name) updates.name = name.trim();
    if (avatar) updates.avatar = avatar;
    if (phone !== undefined) updates.phone = phone.trim();
    if (rollNo !== undefined) updates.rollNo = rollNo.trim();
    if (department !== undefined) updates.department = department.trim();

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// ── @GET /api/auth/seed-admin ──────────────────────────────
// Purpose: One-time creation of the Super Admin account (fix for fresh deployments)
const seedAdmin = async (req, res) => {
  try {
    const adminEmail = 'superadmin@campusconnect.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      return res.status(200).json({ message: 'Super Admin already exists!' });
    }

    // Create the initial admin account
    const adminUser = await User.create({
      name: 'Super Admin',
      email: adminEmail,
      password: 'adminpassword123',
      role: 'superAdmin',
    });

    res.status(201).json({
      message: 'Super Admin created successfully!',
      email: adminEmail,
      password: 'adminpassword123'
    });
  } catch (error) {
    res.status(500).json({ message: 'Seeding failed', error: error.message });
  }
};

module.exports = { register, login, getMe, updateInterests, updateProfile, seedAdmin };
