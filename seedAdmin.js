// ── ADMIN SEED SCRIPT ────────────────────────────────────
// Purpose: Run this ONCE to create the first Super Admin account
// Command: node seedAdmin.js
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    // 1. Connect to the database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // 2. Check if a superAdmin already exists to avoid duplicates
    const adminEmail = 'superadmin@campusconnect.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Super Admin already exists!');
      process.exit(0);
    }

    // 3. Create the initial admin account
    // Note: Password will be automatically hashed by User model pre-save hook
    const adminUser = await User.create({
      name: 'Super Admin',
      email: adminEmail,
      password: 'adminpassword123', // CHANGE THIS AFTER FIRST LOGIN
      role: 'superAdmin',
    });

    console.log('Super Admin created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password: adminpassword123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

// Start the process
seedAdmin();
