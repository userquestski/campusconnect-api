// ── NOTIFICATION CONTROLLER ──────────────────────────────
// Manages In-App alerts for User actions (Registrations, Promos, etc.)
const Notification = require('../models/Notification');

// ── @GET /api/notifications ──────────────────────────────
// Purpose: Fetch the most recent 20 alerts for the logged-in student
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 }) // Show newest first
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

// ── @PUT /api/notifications/:id/read ─────────────────────
// Purpose: Clear a specific alert from the user's unread list
const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true }
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// ── HELPER: createNotification ───────────────────────────
// Purpose: Internal function called by other controllers to generate an alert
const createNotification = async (userId, type, title, message) => {
  try {
    await Notification.create({ userId, type, title, message });
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
};

// ── @PUT /api/notifications/read-all ─────────────────────
// Purpose: Allows user to "Clear All" notifications at once
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, createNotification };
