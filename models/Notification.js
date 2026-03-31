// ── DATABASE MODEL: NOTIFICATION ────────────────────────
// Defines short alerts sent to individual users
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // The user who receives the alert
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Category of notification for icon/color selection
  type: {
    type: String,
    enum: ['registration', 'reminder', 'announcement', 'system'],
    default: 'system',
  },
  
  // Short header (e.g., "Registration Confirmed!")
  title: {
    type: String,
    required: true,
  },
  
  // Detailed message body
  message: {
    type: String,
    required: true,
  },
  
  // Tracking if the user has seen the alert
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true }); // Tracks when the notification was created

module.exports = mongoose.model('Notification', notificationSchema);
