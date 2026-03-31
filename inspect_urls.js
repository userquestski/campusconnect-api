const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('./models/Event');
const Club = require('./models/Club');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const events = await Event.find({}).sort({ createdAt: -1 }).limit(10);
    
    events.forEach(e => {
        let urlStr = e.posterURL || '';
        let codes = [];
        for (let i = 0; i < urlStr.length; i++) {
            codes.push(urlStr.charCodeAt(i));
        }
        console.log(`Event: ${e.title} | ID: ${e._id}`);
        console.log(`URL: [${urlStr}]`);
        console.log(`Codes: [${codes.join(',')}]`);
        console.log('---');
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
check();
