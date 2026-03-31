const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({ email: /24h51a05ak/i });
  console.log('--- USERS MATCHING EMAIL ---');
  users.forEach(u => {
    console.log(`ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
  });
  process.exit(0);
}
check();
