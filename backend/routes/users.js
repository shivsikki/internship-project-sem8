const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production'
    );
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// List patients (Doctor/Admin)
router.get('/patients', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || (user.role !== 'doctor' && user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const patients = await User.find({ role: 'patient' })
      .select('name email phone age gender address')
      .sort({ name: 1 });

    res.json({ success: true, patients });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;

