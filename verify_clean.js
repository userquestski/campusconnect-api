const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('./models/Event');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const events = await Event.find({}).sort({ createdAt: -1 }).limit(10);
    
    events.forEach(e => {
        let urlStr = e.posterURL || '';
        if (urlStr.includes('\r')) {
            console.log(`❌ Event ${e.title} STILL HAS \\r`);
        } else {
            console.log(`✅ Event ${e.title} looks CLEAN`);
        }
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
check();
