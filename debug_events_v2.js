const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('./models/Event');
const Club = require('./models/Club');
const User = require('./models/User');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const latestEvents = await Event.find({}).sort({ createdAt: -1 }).limit(5).populate('clubId', 'clubName');
    
    console.log('\n--- LATEST 5 EVENTS ---');
    if (latestEvents.length === 0) {
      console.log('No events found in database.');
    } else {
      latestEvents.forEach(e => {
        console.log(`Title: ${e.title}`);
        console.log(`Club: ${e.clubId ? e.clubId.clubName : 'No Club'}`);
        console.log(`PosterURL: ${e.posterURL}`);
        console.log(`Created: ${e.createdAt}`);
        console.log('---------------------------');
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
check();
