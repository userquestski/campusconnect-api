// ── ADMIN CONTROLLER ──────────────────────────────────────
// High-level controls for Super Admins (Overview & Moderation)
const User = require('../models/User');
const Club = require('../models/Club');
const Event = require('../models/Event');

// ── @GET /api/admin/public-stats ──────────────────────────
// Purpose: Gathers platform-wide statistics for the public home page
const getPublicStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalClubs = await Club.countDocuments({ isApproved: true });
    const totalEvents = await Event.countDocuments();
    
    // Unique categories from events
    const categories = await Event.distinct('category');
    const categoryCount = categories.length || 12; // Fallback to 12 if none found

    res.json({
      totalStudents,
      totalClubs,
      totalEvents,
      categoryCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch public stats', error: error.message });
  }
};

// ── @GET /api/admin/analytics ─────────────────────────────
// Purpose: Gathers platform-wide statistics for the dashboard
const getAnalytics = async (req, res) => {
  try {
    // 1. Count totals for the KPI cards
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalClubs = await Club.countDocuments({ isApproved: true });
    const pendingClubs = await Club.countDocuments({ isApproved: false });
    const totalEvents = await Event.countDocuments();
    
    // 2. Aggregate total registrations across all users
    const totalRegistrations = await User.aggregate([
      { $project: { count: { $size: '$registeredEvents' } } },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ]);

    // 3. Find top 5 most popular event categories
    const categoryStats = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // 4. Identify the club that has posted the most events
    const activeClubs = await Event.aggregate([
      { $group: { _id: '$clubId', eventCount: { $sum: 1 } } },
      { $sort: { eventCount: -1 } },
      { $limit: 1 },
      { $lookup: { from: 'clubs', localField: '_id', foreignField: '_id', as: 'club' } },
    ]);

    res.json({
      totalStudents,
      totalClubs,
      pendingClubs,
      totalEvents,
      totalRegistrations: totalRegistrations[0]?.total || 0,
      categoryStats,
      mostActiveClub: activeClubs[0] || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Analytics failed', error: error.message });
  }
};

// ── @GET /api/admin/pending-clubs ─────────────────────────
// Purpose: List clubs that have submitted profiles but aren't visible yet
const getPendingClubs = async (req, res) => {
  try {
    const clubs = await Club.find({ isApproved: false }).populate('ownerId', 'name email');
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending clubs', error: error.message });
  }
};

// ── @PUT /api/admin/clubs/:id/approve ────────────────────
// Purpose: Moderation action to make a club profile public
const approveClub = async (req, res) => {
  try {
    const club = await Club.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!club) return res.status(404).json({ message: 'Club not found' });
    res.json({ message: `✅ Club "${club.clubName}" approved!`, club });
  } catch (error) {
    res.status(500).json({ message: 'Approval failed', error: error.message });
  }
};

// ── @DELETE /api/admin/clubs/:id ──────────────────────────
// Purpose: Permanent removal of a club from the platform
const deleteClub = async (req, res) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    res.json({ message: 'Club removed' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

// ── @GET /api/admin/users ─────────────────────────────────
// Purpose: View and manage all platform accounts
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password') // Ensure security by hiding hash
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// ── @DELETE /api/admin/users/:id ─────────────────────────
// Purpose: Moderator action to ban or remove a user account
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Safety check: Don't allow an admin to delete themselves or other admins accidentally
    if (user.role === 'superAdmin') {
      return res.status(403).json({ message: 'Cannot delete a super admin account' });
    }
    
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

// ── @GET /api/admin/events ────────────────────────────────
// Purpose: Overview of all posted events across all clubs
const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Event.countDocuments();
    const events = await Event.find()
      .populate('clubId', 'clubName')
      .populate('registeredStudents', 'name email rollNo department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ events, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
};

// ── @DELETE /api/admin/events/:id ────────────────────────
// Purpose: Moderator action to remove inappropriate event postings
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    await event.deleteOne();

    // Clean up references to prevent null pointers 
    if (event.clubId) {
      await Club.findByIdAndUpdate(event.clubId, {
        $pull: { events: event._id }
      });
    }

    await User.updateMany(
      { registeredEvents: event._id },
      { $pull: { registeredEvents: event._id } }
    );
    
    await User.updateMany(
      { waitlistedEvents: event._id },
      { $pull: { waitlistedEvents: event._id } }
    );

    res.json({ message: 'Event completely removed' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

module.exports = {
  getAnalytics, getPublicStats, getPendingClubs, approveClub, deleteClub,
  getAllUsers, deleteUser, getAllEvents, deleteEvent,
};
