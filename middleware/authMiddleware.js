// ── AUTH MIDDLEWARE ──────────────────────────────────────
// Gatekeepers that ensure only the right users access protected routes
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── PROTECT (JWT VERIFICATION) ───────────────────────────
// Purpose: Checks if the request has a valid session token
const protect = async (req, res, next) => {
  let token;

  // 1. Look for token in the Authorization header (format: "Bearer THE_TOKEN_HERE")
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // 2. Decode the token using the secret key to get the User ID
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find the user in the database and attach it to the 'req' object 
      // This makes the user's data available to all subsequent controller functions
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next(); // Success: proceed to the next function/controller
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // 4. If no token was found at all
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// ── AUTHORIZE (ROLE CHECKING) ───────────────────────────
// Purpose: Restricts access to specific roles (e.g., student only, admin only)
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if the user's role (extracted during 'protect') is in the allowed list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Role '${req.user.role}' is not allowed here.`
      });
    }
    next(); // Access granted
  };
};

// ── SOFT PROTECT (OPTIONAL JWT CHECK) ────────────────────
// Purpose: Tries to find the user but doesn't block the request if they are not logged in.
// Useful for public pages that show extra info to the owner.
const softProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      // Ignore errors, user just won't be populated
    }
  }
  next();
};

module.exports = { protect, authorize, softProtect };
