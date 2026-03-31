// ── TOKEN GENERATOR ──────────────────────────────────────
// Creates a secure JSON Web Token (JWT) for user sessions
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  // Signs the user's ID into a token that only the server can decrypt
  return jwt.sign(
    { id: userId }, // Payload: just the user's unique DB ID
    process.env.JWT_SECRET, // Secret key from .env to verify authenticity
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } // Session duration (default: 1 day)
  );
};

module.exports = generateToken;
