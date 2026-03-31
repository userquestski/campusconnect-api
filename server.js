// ── CAMPUSCONNECT BACKEND ─────────────────────────────────
// Entry point for the Node.js / Express server
// ─────────────────────────────────────────────────────────

// 1. Initial Setup: Environment and core modules
require("dotenv").config(); // Load variables from .env (DB URIs, Secret Keys, etc.)

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const helmet = require("helmet");   // Security headers
const cors = require("cors");       // Cross-Origin Resource Sharing
const rateLimit = require("express-rate-limit"); // Brute-force protection

const app = express();
const PORT = process.env.PORT || 5000;

// ── SECURITY MIDDLEWARE ───────────────────────────────────
// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet());

// ── CORS POLICY ──────────────────────────────────────────
// Controls which frontends (domains) are allowed to talk to this API
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:3000', 'null'];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or local files)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('null')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ── DATA PARSING ─────────────────────────────────────────
// Allows Express to understand JSON data sent in request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── RATE LIMITING ────────────────────────────────────────
// Prevents spam and denial-of-service (DoS) attacks
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 200,                // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Stricter limits for Login/Register to prevent password guessing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please wait 15 minutes and try again." },
});

app.use("/api", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ── API ROUTES ───────────────────────────────────────────
// Mount separate route files for organized logic
app.use("/api/auth", require("./routes/authRoutes"));          // Login & Profile
app.use("/api/clubs", require("./routes/clubRoutes"));         // Club discovery
app.use("/api/events", require("./routes/eventRoutes"));       // Event registration
app.use("/api/users", require("./routes/userRoutes"));         // Student dashboards
app.use("/api/admin", require("./routes/adminRoutes"));        // SuperAdmin controls
app.use("/api/notifications", require("./routes/notificationRoutes")); // In-app alerts

// ── STATIC FILES ─────────────────────────────────────────
// Serve uploaded images (posters, logos) from the local 'uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── APP MONITORING ───────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "🎓 CampusConnect API is running!",
    status: "OK",
  });
});

// ── ERROR HANDLING ───────────────────────────────────────
// Fallback for requests to non-existent URLs
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Catch-all for server crashes to provide a clean JSON error response
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(err.status || 500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? "An error occurred" : err.message,
  });
});

// ── LIFTOFF ──────────────────────────────────────────────
// Connect to the database FIRST, then start the server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });