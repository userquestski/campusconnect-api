const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await User.findOne({ email: 'superadmin@campusconnect.com' });
    if (admin) {
      console.log('--- SUPER ADMIN FOUND ---');
      console.log(`ID: ${admin._id} | Name: ${admin.name} | Role: ${admin.role}`);
    } else {
      console.log('--- SUPER ADMIN NOT FOUND ---');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
}
check();
