// ── CLUB CONTROLLER ──────────────────────────────────────
// Manages logic for Club Registration, Following, and Updates
const Club = require('../models/Club');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');

// Helper to determine the correct URL for an image based on storage (Cloudinary vs Local)
const getLogoURL = (req, file) => {
  if (!file) return '';
  // Cloudinary sets an absolute URL in file.path starting with http
  if (file.path && file.path.startsWith('http')) {
    return file.path;
  }
  // Local storage (Multer) sets file.filename
  if (file.filename) {
    const protocol = req.protocol === 'http' && req.get('x-forwarded-proto') ? req.get('x-forwarded-proto') : req.protocol;
    const host = req.get('host');
    const backendURL = process.env.BACKEND_URL || `${protocol}://${host}`;
    const cleanURL = backendURL.toString().replace(/[\r\n]/g, '').trim();
    return `${cleanURL}/uploads/posters/${file.filename}`;
  }
  return file.path;
};

// ── @GET /api/clubs ───────────────────────────────────────
// Purpose: Fetch all approved clubs with optional category filtering
const getAllClubs = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    
    // VISIBILITY LOGIC: Show approved clubs OR the user's own club (if logged in)
    let filter = {
      $or: [
        { isApproved: true },
        { ownerId: req.user ? req.user._id : null }
      ]
    };

    if (category) filter.category = category;
    if (search) filter.clubName = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Club.countDocuments(filter);

    // Populate owner details to show who manages the club
    const clubs = await Club.find(filter)
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      clubs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch clubs', error: error.message });
  }
};

// ── @GET /api/clubs/:id ───────────────────────────────────
// Purpose: Show a specific club's profile, including their upcoming events
const getClubById = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('ownerId', 'name email');

    if (!club) return res.status(404).json({ message: 'Club not found' });

    // Privacy Check: If club is not approved, only the owner can see the full details
    if (!club.isApproved && (!req.user || club.ownerId._id.toString() !== req.user._id.toString())) {
       return res.status(403).json({ message: 'Meeting in progress... Club profile pending approval.' });
    }

    // Populate events separately for better control
    const events = await Event.find({ clubId: club._id }).sort({ date: 1 });
    const clubData = club.toObject();
    clubData.events = events;

    res.json(clubData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch club', error: error.message });
  }
};

// ── @POST /api/clubs ──────────────────────────────────────
// Purpose: Submits a new club for registration (Awaits Admin Approval)
const createClub = async (req, res) => {
  try {
    const { clubName, description, category, socialLinks, contactEmail, contactPhone } = req.body;

    // Field validation
    if (!clubName || !description || !category) {
      return res.status(400).json({ message: 'Club name, description, and category are required' });
    }

    // Restriction: One User can only register one club
    const existing = await Club.findOne({ ownerId: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already have a club registered' });

    // Save to DB (logo URL is provided by Cloudinary middleware)
    const club = await Club.create({
      clubName: clubName.trim(),
      description: description.trim(),
      category,
      ownerId: req.user._id,
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      socialLinks: socialLinks || {},
      logoURL: getLogoURL(req, req.file),
    });

    res.status(201).json({ message: 'Club registered! Awaiting admin approval.', club });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create club', error: error.message });
  }
};

// ── @PUT /api/clubs/:id ───────────────────────────────────
// Purpose: Allows club owners to edit their profile and gallery
const updateClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    
    // Security check: Only the owner of the club can modify it
    if (club.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only allow updating specific profile fields
    const allowedFields = ['clubName', 'description', 'category', 'socialLinks', 'logoURL', 'gallery', 'contactEmail', 'contactPhone'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    if (req.file) updates.logoURL = getLogoURL(req, req.file);
    const updated = await Club.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ message: 'Club updated', club: updated });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// ── @GET /api/clubs/my-club ───────────────────────────────
// Purpose: Fetches the club dashboard for a logged-in Club Admin
const getMyClub = async (req, res) => {
  try {
    // 1. Find the club owned by this user
    // Mongoose handles casting automatically for standard queries
    const club = await Club.findOne({ ownerId: req.user._id });
    
    if (!club) {
      return res.status(404).json({ message: 'No club found for your account. Please register your club first.' });
    }

    // 2. Fetch events directly by clubId for 100% data integrity
    // This is safer than relying on the club.events array which might be out of sync
    const events = await Event.find({ clubId: club._id })
      .populate('registeredStudents', 'name email rollNo department phone')
      .sort({ date: -1 }); // Recently created/upcoming first
    
    // 3. Construct response object manually
    const clubData = club.toObject();
    clubData.events = events;

    res.json(clubData);
  } catch (error) {
    console.error('getMyClub Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch your club details', error: error.message });
  }
};

// ── @POST /api/clubs/:id/follow ───────────────────────────
// Purpose: Adds a student to a club's followers list to get their updates
const followClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    // Prevent duplicate follows
    if (club.followers.includes(req.user._id)) {
      return res.status(400).json({ message: 'You already follow this club' });
    }

    // Add student to club list
    club.followers.push(req.user._id);
    club.followersCount += 1;
    await club.save();

    // Add club to student's follow list
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { followingClubs: club._id },
    });

    res.json({ message: `You are now following ${club.clubName}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to follow club', error: error.message });
  }
};

// ── @DELETE /api/clubs/:id/follow ─────────────────────────
// Purpose: Removes a student from a club's followers
const unfollowClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.followers.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are not following this club' });
    }

    // Remove from club list
    club.followers = club.followers.filter(id => id.toString() !== req.user._id.toString());
    club.followersCount = Math.max(0, club.followersCount - 1);
    await club.save();

    // Remove from user profile
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { followingClubs: club._id },
    });

    res.json({ message: `You unfollowed ${club.clubName}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unfollow club', error: error.message });
  }
};

// ── @POST /api/clubs/:id/announcements ────────────────────
// Purpose: Allows club admins to post messages to their followers
const createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    
    // Security: Only the club's own admin can post announcements
    if (club.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to post announcements for this club' });
    }

    const announcement = await Announcement.create({
      title,
      content,
      clubId: club._id,
    });

    res.status(201).json({ message: 'Announcement created', announcement });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create announcement', error: error.message });
  }
};

// ── @GET /api/clubs/announcements/feed ────────────────────
// Purpose: Gathers posts from ALL clubs a student follows into one stream
const getAnnouncementsFeed = async (req, res) => {
  try {
    // 1. Get the list of clubs the current user is following
    const user = await User.findById(req.user._id).populate('followingClubs', '_id');
    const followingClubIds = user.followingClubs.map(c => c._id);

    // 2. Find announcements where clubId is in that list
    const announcements = await Announcement.find({ clubId: { $in: followingClubIds } })
      .populate('clubId', 'clubName logoURL')
      .sort({ createdAt: -1 }) // Newest first
      .limit(20);

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch announcements feed', error: error.message });
  }
};

module.exports = { 
  getAllClubs, getClubById, createClub, updateClub, getMyClub,
  followClub, unfollowClub, createAnnouncement, getAnnouncementsFeed
};
