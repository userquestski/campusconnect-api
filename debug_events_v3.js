const mongoose = require('mongoose');
require('dotenv').config();
const Club = require('./models/Club');
const Event = require('./models/Event');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const latestEvents = await Event.find({}).sort({ createdAt: -1 }).limit(1).populate('clubId', 'clubName');
    
    if (latestEvents.length === 0) {
      console.log('No events found.');
    } else {
      const e = latestEvents[0];
      console.log('--- LATEST EVENT ---');
      console.log(`ID: ${e._id}`);
      console.log(`Title: ${e.title}`);
      console.log(`Club: ${e.clubId ? e.clubId.clubName : 'No Club'}`);
      console.log(`Date: ${e.date}`);
      console.log(`isActive: ${e.isActive}`);
      // Printing each char in posterURL to check for hidden chars
      console.log(`PosterURL: ${e.posterURL}`);
      console.log('---------------------------');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
check();
