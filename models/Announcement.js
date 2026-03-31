// ── DATABASE MODEL: ANNOUNCEMENT ────────────────────────
// Defines club-wide updates that appear in the community feed
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  // Short summary of the update
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true,
  },
  
  // The full text content of the announcement
  content: {
    type: String,
    required: [true, 'Announcement content is required'],
  },
  
  // The club that posted this update
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
  },
}, { timestamps: true }); // Tracks when it was posted

module.exports = mongoose.model('Announcement', announcementSchema);
