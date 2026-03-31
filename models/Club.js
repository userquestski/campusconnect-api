// ── DATABASE MODEL: CLUB ────────────────────────────────
// Defines the structure for student-run organizations
const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  // Unique name of the club (e.g., "ACM Student Chapter")
  clubName: {
    type: String,
    required: [true, 'Club name is required'],
    trim: true,
    unique: true,
  },

  // Detailed description of the club's mission and activities
  description: {
    type: String,
    required: [true, 'Description is required'],
  },

  // Main area of focus (used for recommendations)
  category: {
    type: String,
    required: true,
    enum: ['Technical', 'Cultural', 'Sports', 'Hackathons', 'Workshops', 'Entrepreneurship', 'Arts', 'Other'],
  },

  // Cloudinary URL for the club's logo
  logoURL: {
    type: String,
    default: '',
  },

  // The User who manages this club (must have 'clubAdmin' role)
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Collection of events created by this club
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  }],

  // Approval status (only superAdmins can set this to true)
  isApproved: {
    type: Boolean,
    default: false,
  },

  // Direct contact information for organizers
  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },

  // Links to external club profiles
  socialLinks: {
    instagram: { type: String, default: '' },
    linkedin:  { type: String, default: '' },
    website:   { type: String, default: '' },
  },

  // Total count of students following the club
  followersCount: {
    type: Number,
    default: 0,
  },

  // List of student IDs who are following this club
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  // Collection of image URLs for the club's media gallery
  gallery: [{
    type: String,
  }],

}, { timestamps: true }); // Automatically adds createdAt and updatedAt

module.exports = mongoose.model('Club', clubSchema);
