// ── STORAGE CONFIGURATION ────────────────────────────
// Setup for uploading event posters and club logos
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Determine if we should use Cloudinary or Local Storage
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

let storage;

if (isCloudinaryConfigured) {
  // Use Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'campusconnect/posters',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, height: 630, crop: 'limit' }],
    },
  });
  console.log('☁️ Storage: Using Cloudinary');
} else {
  // Use Local Disk Storage
  const uploadDir = path.join(__dirname, '../uploads/posters');
  if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const name = 'poster-' + uniqueSuffix + ext;
      // We set a custom property to store the relative path for the DB
      file.relativeURL = `/uploads/posters/${name}`;
      cb(null, name);
    }
  });
  console.log('📂 Storage: Falling back to Local Disk Storage (Cloudinary keys missing)');
}

const upload = multer({ storage });

module.exports = { cloudinary, upload, isCloudinaryConfigured };

