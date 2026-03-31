const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('./models/Event');
const Club = require('./models/Club');
const User = require('./models/User');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: '24h51a05ak@cmrcet.ac.in' });
  if (!user) { console.log('User not found'); process.exit(0); }
  const club = await Club.findOne({ ownerId: user._id });
  if (!club) { console.log('Club not found for', user.email); process.exit(0); }
  const events = await Event.find({ clubId: club._id });
  console.log('User:', user.email);
  console.log('Club:', club.clubName, 'ID:', club._id);
  console.log('Events Count:', events.length);
  events.forEach(e => console.log(' - Event:', e.title, 'Created:', e.createdAt));
  process.exit(0);
}
check();
