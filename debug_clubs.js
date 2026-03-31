const mongoose = require('mongoose');
require('dotenv').config();
const Club = require('./models/Club');
const User = require('./models/User');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const clubs = await Club.find().populate('ownerId', 'email name');
  console.log('--- ALL REGISTERED CLUBS ---');
  clubs.forEach(c => {
    console.log(`Club: ${c.clubName} (ID: ${c._id})`);
    console.log(`  Owner: ${c.ownerId?.email || 'OFFLINE OWNER'} (Name: ${c.ownerId?.name || 'N/A'})`);
    console.log(`  Category: ${c.category}`);
    console.log(`  Approved: ${c.isApproved}`);
    console.log('---');
  });
  process.exit(0);
}
check();
