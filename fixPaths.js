require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const Club = require('./models/Club');
const path = require('path');

const fixLocalPaths = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const backendURL = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`).toString().replace(/[\r\n]/g, '').trim();
    console.log(`Using Backend URL: ${backendURL}`);

    // Fix Events: look for local paths or localhost placeholders
    const events = await Event.find({});
    let eventFixes = 0;
    for (const e of events) {
      if (e.posterURL) {
        const cleaned = e.posterURL.toString().replace(/[\r\n\t]/g, '').trim();
        
        // If it's a local filename or an old localhost URL, refresh it
        if (!cleaned.startsWith('http') || cleaned.includes('localhost') || cleaned.includes('127.0.0.1')) {
          const parts = cleaned.split('/'); 
          const filename = parts[parts.length - 1]; 
          if (filename && filename.includes('poster-')) {
            e.posterURL = `${backendURL}/uploads/posters/${filename}`;
            await e.save();
            eventFixes++;
          }
        } else if (e.posterURL !== cleaned) {
            e.posterURL = cleaned;
            await e.save();
            eventFixes++;
        }
      }
    }

    // Fix Clubs
    const clubs = await Club.find({});
    let clubFixes = 0;
    for (const c of clubs) {
      if (c.logoURL) {
        const cleaned = c.logoURL.toString().replace(/[\r\n\t]/g, '').trim();
        if (!cleaned.startsWith('http') || cleaned.includes('localhost') || cleaned.includes('127.0.0.1')) {
          const parts = cleaned.split('/');
          const filename = parts[parts.length - 1];
          if (filename && (filename.includes('logo-') || filename.includes('poster-'))) {
            c.logoURL = `${backendURL}/uploads/posters/${filename}`;
            await c.save();
            clubFixes++;
          }
        } else if (c.logoURL !== cleaned) {
            c.logoURL = cleaned;
            await c.save();
            clubFixes++;
        }
      }
    }

    console.log(`✅ Fixed ${eventFixes} events and ${clubFixes} clubs paths.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

fixLocalPaths();
