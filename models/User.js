// ── DATABASE MODEL: USER ────────────────────────────────
// Defines structure for Students, Club Admins, and Super Admins
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic display name (e.g., "John Doe")
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 60,
  },

  // Unique email used for login and notifications
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },

  // Secure password (hidden from normal queries via 'select: false')
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false, 
  },

  // User permission level
  role: {
    type: String,
    enum: ['student', 'clubAdmin', 'superAdmin'],
    default: 'student',
  },

  // Student-specific: categories they want to see events for
  interests: [{
    type: String,
    enum: ['Technical', 'Cultural', 'Sports', 'Hackathons', 'Workshops', 'Entrepreneurship', 'Arts', 'AI', 'Coding'],
  }],

  // IDs of events the student has signed up for
  registeredEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  }],

  // IDs of events currently on the waitlist
  waitlistedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  }],

  // IDs of clubs the user follows for updates
  followingClubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
  }],

  // Image link for profile picture
  avatar: {
    type: String,
    default: '',
  },

  // Additional profile metadata
  phone: { type: String, default: '' },
  rollNo: { type: String, default: '' },
  department: { type: String, default: '' },

}, { timestamps: true }); // Automatically maintains createdAt and updatedAt

// ── PRE-SAVE HOOK: PASSWORD HASHING ──────────────────────
// Runs before saving a user to scramble the password using Bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── SCHEMA METHOD: PASSWORD VERIFICATION ─────────────────
// Used during login to check if typed password matches the hashed one
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
