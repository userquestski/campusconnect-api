// ── DATABASE MODEL: EVENT ───────────────────────────────
// Defines the structure and rules for campus events
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // The official name of the event
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
  },

  // Detailed information about what the event covers
  description: {
    type: String,
    required: [true, 'Description is required'],
  },

  // Used for filtering and recommendation logic
  category: {
    type: String,
    required: true,
    enum: ['Technical', 'Cultural', 'Sports', 'Hackathons', 'Workshops', 'Entrepreneurship', 'Arts', 'Other'],
  },

  // Cloudinary URL for the event's promotional image
  posterURL: {
    type: String,
    default: '',
  },

  // Highlighted guests or speakers (CSV list in UI)
  guests: [{
    type: String,
  }],

  // Date and Time of the event
  date: {
    type: Date,
    required: [true, 'Event date is required'],
  },
  time: {
    type: String,  // Example format: "10:00 AM"
    required: [true, 'Event time is required'],
  },

  // Where the event takes place (e.g., "Auditorium A")
  venue: {
    type: String,
    required: [true, 'Venue is required'],
  },

  // Cut-off date for signing up
  registrationDeadline: {
    type: Date,
    required: true,
  },

  // Entry cost (0 indicates it is a free event)
  participationFee: {
    type: Number,
    default: 0,
  },

  // Payment receiver details (required if participationFee > 0)
  paymentUpi: {
    type: String,
    default: '',
  },

  // If this is hosted off-platform (like an external hackathon)
  externalLink: {
    type: String,
    default: null,
  },

  // Contact details for the event primary coordinator
  coordinatorName: {
    type: String,
    default: '',
  },
  coordinatorPhone: {
    type: String,
    default: '',
  },

  // The club organizing this event (linked to Club model)
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
  },

  // List of students who are officially registered
  registeredStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  // Students who showed up and had their QR scanned
  attendedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  // Total capacity (null means unlimited attendees)
  maxParticipants: {
    type: Number,
    default: null, 
  },

  // Students who signed up after it reached full capacity
  waitlistStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  // Track payment screenshots for audit (only for paid events)
  paymentProofs: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    proofURL: String,
    timestamp: { type: Date, default: Date.now }
  }],

  // Whether the event is visible to students
  isActive: {
    type: Boolean,
    default: true,
  },

}, { timestamps: true }); // Tracks creation and update times

module.exports = mongoose.model('Event', eventSchema);
