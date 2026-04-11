const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const jwt = require('jsonwebtoken');

// Configure Cloudinary from existing env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer for purely in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// POST /api/upload
router.post('/', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // Cloudinary upload stream
  const cld_upload_stream = cloudinary.uploader.upload_stream(
    { folder: 'hippocrates_imaging' },
    (error, result) => {
      if (error) {
        console.error('Cloudinary API Error:', error);
        return res.status(500).json({ success: false, message: 'Cloudinary upload failed', error: error.message });
      }
      // Return the secure URL to the frontend
      res.json({
        success: true,
        url: result.secure_url,
        fileName: req.file.originalname
      });
    }
  );

  // Pipe the buffer to Cloudinary
  streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
});

module.exports = router;
