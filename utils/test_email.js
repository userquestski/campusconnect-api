// scripts/test_email.js
require('dotenv').config({ path: '../.env' });
const { sendRegistrationConfirmation } = require('../utils/emailService');

const testEmail = async () => {
    console.log('--- Email Configuration ---');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '********' : 'NOT SET');
    console.log('---------------------------');

    if (process.env.EMAIL_USER === 'youremail@gmail.com') {
        console.error('❌ ERROR: You are still using the placeholder email address.');
        process.exit(1);
    }

    try {
        console.log('Attempting to send test email...');
        await sendRegistrationConfirmation(
            process.env.EMAIL_USER, 
            'Tester', 
            'Email Test Event', 
            new Date(), 
            'Remote Laboratory'
        );
        console.log('✅ SUCCESS: Test email sent! Check your inbox.');
    } catch (error) {
        console.error('❌ FAILED: Error sending email.');
        console.error(error.message);
        console.log('\nCommon Fixes:');
        console.log('1. Ensure you used a Gmail "App Password", NOT your regular password.');
        console.log('2. Check if 2-Step Verification is enabled on your Google Account.');
        console.log('3. Double-check your email address in the .env file.');
    }
};

testEmail();
