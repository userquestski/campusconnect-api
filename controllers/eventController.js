// ── EVENT CONTROLLER ─────────────────────────────────────
// Handles logical operations for Creating, Filtering, and Registering for Events
const { validationResult } = require('express-validator');
const Event = require('../models/Event');
const Club = require('../models/Club');
const User = require('../models/User');
const Tesseract = require('tesseract.js');
const { sendRegistrationConfirmation, sendEventAnnouncement } = require('../utils/emailService');
const { createNotification } = require('./notificationController');

// Helper to determine the correct URL for an image based on storage (Cloudinary vs Local)
const getUploadURL = (file) => {
  if (!file) return '';
  // Cloudinary sets an absolute URL in file.path starting with http
  if (file.path && file.path.startsWith('http')) {
    return file.path;
  }
  // Local storage (Multer) sets file.filename
  if (file.filename) {
    const backendURL = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`).toString().replace(/[\r\n]/g, '').trim();
    return `${backendURL}/uploads/posters/${file.filename}`;
  }
  return file.path;
};

// ── @GET /api/events ─────────────────────────────────────
// Purpose: Fetch list of active events with matching filters and pagination
const getAllEvents = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 100 } = req.query;
    let filter = { isActive: true };

    // Apply filters if provided by user
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' }; // Case-insensitive fuzzy search

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Event.countDocuments(filter);

    // Fetch and populate club info for display on the card
    const events = await Event.find(filter)
      .populate('clubId', 'clubName logoURL')
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      events,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)), // Calculate total pages for frontend pagination
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
};

// ── @GET /api/events/:id ─────────────────────────────────
// Purpose: Show full details of a single event and its attendee list
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('clubId', 'clubName logoURL description')
      .populate('registeredStudents', 'name email');

    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
};

// ── @POST /api/events ────────────────────────────────────
// Purpose: Allows Club Admins to post a new campus activity
const createEvent = async (req, res) => {
  try {
    const {
      title, description, category, date, time,
      venue, registrationDeadline, participationFee, paymentUpi, maxParticipants, externalLink, guests,
      coordinatorName, coordinatorPhone
    } = req.body;

    // Verify requesting user owns a registered club
    const club = await Club.findOne({ ownerId: req.user._id });
    if (!club) return res.status(404).json({ message: 'No club found for this admin' });
    if (!club.isApproved) return res.status(403).json({ message: 'Your club is pending approval' });
    
    // Save event to Database
    const event = await Event.create({
      title, description, category, date, time, venue, 
      registrationDeadline, participationFee, paymentUpi, maxParticipants, externalLink,
      clubId: club._id,
      posterURL: getUploadURL(req.file),
      coordinatorName: coordinatorName || club.clubName, // Default to club name if missing
      coordinatorPhone: coordinatorPhone || club.contactPhone || '',
      guests: guests ? (Array.isArray(guests) ? guests : guests.split(',').map(s=>s.trim()).filter(Boolean)) : []
    });

    // Link the event back to the club's event list
    if (!club.events) club.events = [];
    club.events.push(event._id);
    await club.save();

    // MATCHMAKING: Find students interested in this category and alert them
    const interestedStudents = await User.find({ role: 'student', interests: category });
    for (const student of interestedStudents) {
      try {
        await sendEventAnnouncement(student.email, student.name, title, club.clubName, date, category);
        await createNotification(student._id, 'announcement', 'New Event!', `${club.clubName} just posted a new ${category} event: ${title}`);
      } catch (e) {
        console.log(`Email/Notif failed for ${student.email}:`, e.message);
      }
    }

    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
};

// ── @PUT /api/events/:id ─────────────────────────────────
// Purpose: Allows organizers to update event details (Venue, Time, etc.)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Security check: Only the organizing club can edit the event
    const club = await Club.findOne({ ownerId: req.user._id });
    if (!club || event.clubId.toString() !== club._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    // Filter updates for allowedFields only
    const allowedFields = ['title', 'description', 'category', 'date', 'time', 'venue', 'registrationDeadline', 'participationFee', 'paymentUpi', 'maxParticipants', 'externalLink', 'isActive', 'guests', 'coordinatorName', 'coordinatorPhone'];
    const updates = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) {
          if (f === 'guests') updates[f] = Array.isArray(req.body[f]) ? req.body[f] : req.body[f].split(',').map(s=>s.trim()).filter(Boolean);
          else updates[f] = req.body[f];
      }
    });

    if (req.file) updates.posterURL = getUploadURL(req.file);

    const updated = await Event.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ message: 'Event updated', event: updated });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// ── @POST /api/events/:id/register ───────────────────────
// Purpose: Handles complexity of sign-ups, deadlines, and waitlists
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // DEADLINE LOGIC: Check if today is past the signup cut-off
    const deadline = new Date(event.registrationDeadline);
    deadline.setHours(23, 59, 59, 999);
    if (new Date() > deadline) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // CHECK FOR PRE-EXISTING REGISTRATION
    if (event.registeredStudents.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    if (event.waitlistStudents && event.waitlistStudents.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are already on the waitlist for this event' });
    }

    // ── SMART AI PAYMENT VERIFICATION ──────────────────────
    if (event.participationFee > 0) {
      if (!req.file) {
        return res.status(400).json({ message: 'A payment screenshot is required for paid events.' });
      }
      try {
        console.log('🤖 AI OCR starting on:', req.file.path);
        const { data: { text } } = await Tesseract.recognize(req.file.path, 'eng');
        const searchTxt = text.toLowerCase();
        const successKeywords = ['success', 'paid', 'sent', 'completed', '₹', 'rupee', 'transaction', 'debit', event.participationFee.toString()];
        const isValid = successKeywords.some(kw => searchTxt.includes(kw));
        if (!isValid) {
          return res.status(400).json({ message: 'AI Scanner Failed: Could not detect a successful payment in your screenshot. Please upload a clear receipt showing the transaction.' });
        }
      } catch (ocrErr) {
        console.error('OCR Error:', ocrErr);
        return res.status(500).json({ message: 'AI Scanner encountered an error. Please try again.' });
      }
    }

    // WAITLIST LOGIC: If full, add to waitlist instead of registered list
    if (event.maxParticipants && event.registeredStudents.length >= event.maxParticipants) {
      event.waitlistStudents.push(req.user._id);
      await event.save();

      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { waitlistedEvents: event._id },
      });

      return res.json({ message: 'Event is full. You have been added to the waitlist.' });
    }

    // NORMAL REGISTRATION: Add student to event and event to student's profile
    if (req.file) {
      event.paymentProofs.push({
        studentId: req.user._id,
        proofURL: getUploadURL(req.file),
        timestamp: new Date()
      });
    }

    event.registeredStudents.push(req.user._id);
    await event.save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { registeredEvents: event._id },
    });

    // POST-REGISTRATION WORKFLOW: Email and In-App notification
    try {
      await sendRegistrationConfirmation(req.user.email, req.user.name, event.title, event.date, event.venue);
      await createNotification(req.user._id, 'registration', 'Registration Confirmed!', `You successfully registered for ${event.title}.`);
    } catch (e) {
      console.log('Confirmation email/notif failed:', e.message);
    }

    res.json({ message: '🎉 Successfully registered! Check your email for confirmation.' });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// ── @DELETE /api/events/:id/register ─────────────────────
// Purpose: Allows students to withdraw and handles automatic waitlist promotion
const unregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isRegistered = event.registeredStudents.includes(req.user._id);
    const isWaitlisted = event.waitlistStudents && event.waitlistStudents.includes(req.user._id);

    if (!isRegistered && !isWaitlisted) {
      return res.status(400).json({ message: 'You are not registered or waitlisted for this event.' });
    }

    // If waitlisted, just remove from waitlist list
    if (isWaitlisted) {
      event.waitlistStudents = event.waitlistStudents.filter(
        id => id.toString() !== req.user._id.toString()
      );
      await event.save();

      await User.findByIdAndUpdate(req.user._id, {
        $pull: { waitlistedEvents: event._id },
      });

      return res.json({ message: 'Successfully removed from the waitlist.' });
    }

    // REMOVAL FROM MAIN LIST
    event.registeredStudents = event.registeredStudents.filter(
      id => id.toString() !== req.user._id.toString()
    );

    // AUTO-PROMOTION: If someone drops out and there is a waitlist, move the first person up
    let promotedUser = null;
    if (event.waitlistStudents && event.waitlistStudents.length > 0) {
      const promotedUserId = event.waitlistStudents.shift(); 
      event.registeredStudents.push(promotedUserId);

      promotedUser = await User.findById(promotedUserId);

      if (promotedUser) {
        promotedUser.waitlistedEvents = promotedUser.waitlistedEvents.filter(eId => eId.toString() !== event._id.toString());
        if (!promotedUser.registeredEvents.includes(event._id)) {
           promotedUser.registeredEvents.push(event._id);
        }
        await promotedUser.save();
      }
    }

    await event.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { registeredEvents: event._id },
    });

    // EMAIL PROMOTED USER
    if (promotedUser) {
      const { sendWaitlistPromotion } = require('../utils/emailService');
      try {
         await sendWaitlistPromotion(promotedUser.email, promotedUser.name, event.title, event.date, event.venue);
      } catch (e) {
         console.log('Waitlist promotion email failed:', e.message);
      }
    }

    res.json({ message: 'Successfully unregistered from event.' });
  } catch (error) {
    res.status(500).json({ message: 'Unregister failed', error: error.message });
  }
};

// ── @POST /api/events/:id/attendance ──────────────────────
// Purpose: Mark a student as attended via QR scan
const markAttendance = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ message: 'Invalid QR Code: Missing student ID' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Validate ownership before allowing scanning
    const club = await Club.findOne({ ownerId: req.user._id });
    if (!club || event.clubId.toString() !== club._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to scan tickets for this event' });
    }

    // Verify registration
    if (!event.registeredStudents.includes(studentId)) {
      return res.status(400).json({ message: 'This student is not officially registered for this event!' });
    }

    // Check if already attended
    if (event.attendedStudents.includes(studentId)) {
      return res.status(400).json({ message: '❌ Ticket already scanned! Student already checked in.' });
    }

    event.attendedStudents.push(studentId);
    await event.save();

    // Fetch student name for the success toast
    const student = await User.findById(studentId);

    res.json({ message: `✅ ${student ? student.name : 'Student'} verified and checked in!` });
  } catch (error) {
    res.status(500).json({ message: 'Scan failed', error: error.message });
  }
};

// ── @DELETE /api/events/:id ───────────────────────────────
// Purpose: Allow organizers to permanently remove an event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Validate ownership before deletion
    const club = await Club.findOne({ ownerId: req.user._id });
    if (!club || event.clubId.toString() !== club._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();

    // Remove from Club's events list
    if (club.events && club.events.includes(event._id)) {
      club.events = club.events.filter(id => id.toString() !== event._id.toString());
      await club.save();
    }

    // Remove from all Users' registered or waitlisted matching this event
    await User.updateMany(
      { registeredEvents: event._id },
      { $pull: { registeredEvents: event._id } }
    );
    await User.updateMany(
      { waitlistedEvents: event._id },
      { $pull: { waitlistedEvents: event._id } }
    );

    res.json({ message: 'Event deleted completely' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

// ── @GET /api/events/recommended ──────────────────────────
// Purpose: Uses an AI scoring heuristic to suggest events to the user
const getRecommendedEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followingClubs', '_id')
      .populate('registeredEvents', 'category _id');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Filter out null events in case an event was deleted but still referenced
    const validRegisteredEvents = (user.registeredEvents || []).filter(e => e != null);

    // 1. Gather User's Preferences
    const followedClubs = user.followingClubs.map(c => c._id.toString());
    const pastCategories = [...new Set(validRegisteredEvents.map(e => e.category))];
    const registeredEventIds = validRegisteredEvents.map(e => e._id.toString());
    const userDept = (user.department || '').toLowerCase();

    // Crude Department Mapping
    const deptMapping = {
      'computer science': ['Hackathons', 'Technical', 'Workshops'],
      'cse': ['Hackathons', 'Technical', 'Workshops'],
      'it': ['Hackathons', 'Technical', 'Workshops'],
      'bca': ['Hackathons', 'Technical', 'Workshops'],
      'business': ['Entrepreneurship'],
      'bba': ['Entrepreneurship'],
      'arts': ['Arts', 'Cultural'],
      'sports': ['Sports'],
    };

    let inferredCategories = [];
    for (const [key, cats] of Object.entries(deptMapping)) {
      if (userDept.includes(key)) {
        inferredCategories.push(...cats);
      }
    }

    // 2. Fetch all upcoming events the user is NOT registered for
    const today = new Date();
    today.setHours(0,0,0,0);
    const upcomingEvents = await Event.find({
      date: { $gte: today },
      isActive: true,
      _id: { $nin: registeredEventIds }
    }).populate('clubId', 'clubName logoURL');

    // 3. Score the events
    const scoredEvents = upcomingEvents.map(ev => {
      let score = 0;
      if (followedClubs.includes(ev.clubId?._id.toString())) score += 5;
      if (pastCategories.includes(ev.category)) score += 4;
      if (inferredCategories.includes(ev.category)) score += 3;
      
      return { event: ev, score };
    });

    // 4. Sort by score (desc) then by date (asc)
    scoredEvents.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score; // Highest score first
      return new Date(a.event.date) - new Date(b.event.date); // Earliest date first
    });

    // Extract top 3 recommendations
    const topRecommendations = scoredEvents.slice(0, 3).map(s => s.event);

    res.json(topRecommendations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recommendations', error: error.message });
  }
};

module.exports = {
  getAllEvents, getEventById, createEvent, updateEvent,
  registerForEvent, unregisterFromEvent, deleteEvent, markAttendance, getRecommendedEvents
};
