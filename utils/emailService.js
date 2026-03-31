// ── EMAIL SERVICE ────────────────────────────────────────
// Logic for sending transactional emails (Registration, Reminders, etc.)
const nodemailer = require('nodemailer');

// 1. Connection Config: Setup Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Uses a 16-character Google App Password
  },
});

// 2. Connectivity Check: Verify login details on start
transporter.verify(function (error, success) {
  if (error) {
    console.log("⚠️ Email server connection error: ", error.message);
  } else {
    console.log("📧 Email server is ready to take messages");
  }
});

// ── TEMPLATE: REGISTRATION CONFIRMATION ────────────────────
// Purpose: Triggered when a student successfully joins an event
const sendRegistrationConfirmation = async (toEmail, studentName, eventTitle, eventDate, eventVenue) => {
  const mailOptions = {
    from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `✅ Registration Confirmed — ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9ff; padding: 30px; border-radius: 12px;">
        <h2 style="color: #6c63ff;">🎓 CampusConnect</h2>
        <h3 style="color: #333;">You're registered! 🎉</h3>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>Your registration for <strong>${eventTitle}</strong> has been confirmed.</p>
        <div style="background: #fff; border: 1px solid #e0e0ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <p><strong>📅 Date:</strong> ${new Date(eventDate).toDateString()}</p>
          <p><strong>📍 Venue:</strong> ${eventVenue}</p>
        </div>
        <p style="color: #888; font-size: 13px;">You'll receive a reminder 24 hours before the event. See you there!</p>
        <p>— Team CampusConnect</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// ── TEMPLATE: EVENT REMINDER ──────────────────────────────
// Purpose: Sent 1 day before an event to boost attendance
const sendEventReminder = async (toEmail, studentName, eventTitle, eventDate, eventVenue, eventTime) => {
  const mailOptions = {
    from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `⏰ Reminder: ${eventTitle} is Tomorrow!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9ff; padding: 30px; border-radius: 12px;">
        <h2 style="color: #6c63ff;">🎓 CampusConnect</h2>
        <h3>Don't forget — your event is tomorrow! 🔔</h3>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>This is a reminder for <strong>${eventTitle}</strong> happening tomorrow.</p>
        <div style="background: #fff; border: 1px solid #e0e0ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <p><strong>📅 Date:</strong> ${new Date(eventDate).toDateString()}</p>
          <p><strong>⏰ Time:</strong> ${eventTime}</p>
          <p><strong>📍 Venue:</strong> ${eventVenue}</p>
        </div>
        <p>— Team CampusConnect</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// ── TEMPLATE: EVENT ANNOUNCEMENT ──────────────────────────
// Purpose: Alerts students when a new event matches their interests
const sendEventAnnouncement = async (toEmail, studentName, eventTitle, clubName, eventDate, category) => {
  const mailOptions = {
    from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🚀 New ${category} Event: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9ff; padding: 30px; border-radius: 12px;">
        <h2 style="color: #6c63ff;">🎓 CampusConnect</h2>
        <h3>New event matching your interests! 🎯</h3>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p><strong>${clubName}</strong> just posted a new event you might love:</p>
        <div style="background: #fff; border: 1px solid #e0e0ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <h4 style="color: #6c63ff;">${eventTitle}</h4>
          <p><strong>📅 Date:</strong> ${new Date(eventDate).toDateString()}</p>
          <p><strong>🏷 Category:</strong> ${category}</p>
        </div>
        <a href="${process.env.CLIENT_URL}/events" style="background: #6c63ff; color: white; padding: 12px 24px; border-radius: 30px; text-decoration: none; display: inline-block;">View Event</a>
        <p style="color: #888; font-size: 13px; margin-top: 20px;">You received this because it matches your interests.</p>
        <p>— Team CampusConnect</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// ── TEMPLATE: WAITLIST PROMOTION ──────────────────────────
// Purpose: Sent when a waitlisted student is automatically bumped to a Registered spot
const sendWaitlistPromotion = async (toEmail, studentName, eventTitle, eventDate, eventVenue) => {
  const mailOptions = {
    from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🎉 Good News! You're moved off the waitlist for ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9ff; padding: 30px; border-radius: 12px;">
        <h2 style="color: #6c63ff;">🎓 CampusConnect</h2>
        <h3 style="color: #333;">You're in! 🎉</h3>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>A spot opened up and you have been successfully moved off the waitlist and registered for <strong>${eventTitle}</strong>!</p>
        <div style="background: #fff; border: 1px solid #e0e0ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <p><strong>📅 Date:</strong> ${new Date(eventDate).toDateString()}</p>
          <p><strong>📍 Venue:</strong> ${eventVenue}</p>
        </div>
        <p style="color: #888; font-size: 13px;">You'll receive a reminder 24 hours before the event. See you there!</p>
        <p>— Team CampusConnect</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendRegistrationConfirmation,
  sendEventReminder,
  sendEventAnnouncement,
  sendWaitlistPromotion,
};
