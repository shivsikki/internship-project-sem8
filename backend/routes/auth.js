const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const upload = require('../middleware/upload');
const path = require('path');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production', {
    expiresIn: '30d'
  });
};

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, specialization, licenseNumber, age, gender, phone, address } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    if (!['doctor', 'admin', 'patient'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be doctor, admin, or patient' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      role
    };

    if (role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount === 0) {
        userData.isRootAdmin = true;
        userData.isApproved = true;
      } else {
        userData.isRootAdmin = false;
        userData.isApproved = false;
      }
    }

    // Add role-specific fields
    if (role === 'doctor') {
      userData.specialization = specialization || '';
      userData.licenseNumber = licenseNumber || '';
    } else if (role === 'patient') {
      userData.age = age || null;
      userData.gender = gender || null;
      userData.phone = phone || '';
      userData.address = address || '';
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// Sign In
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    if (user.role === 'admin' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your admin account is pending approval from the root admin.'
      });
    }

    if (user.role === 'doctor' && !user.isVerified) {
      return res.status(403).json({
        success: false,
        message: `Your doctor account is ${user.verificationStatus}. Please wait for admin verification.`
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by the administrator. Please contact support.'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        licenseNumber: user.licenseNumber
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      error: error.message 
    });
  }
});

// Get current user (protected route)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
});

// Get all pending doctors (admin only)
router.get('/pending-doctors', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production');
    const admin = await User.findById(decoded.userId);

    if (!admin || admin.role !== 'admin' || !admin.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const pendingDoctors = await User.find({ 
      role: 'doctor', 
      verificationStatus: 'pending' 
    }).select('-password');

    res.json({
      success: true,
      doctors: pendingDoctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Verify/Reject doctor (admin only)
router.post('/verify-doctor', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production');
    const admin = await User.findById(decoded.userId);

    if (!admin || admin.role !== 'admin' || !admin.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { doctorId, action } = req.body; // action: 'verify' or 'reject'

    if (!doctorId || !['verify', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    doctor.isVerified = action === 'verify';
    doctor.verificationStatus = action === 'verify' ? 'verified' : 'rejected';
    await doctor.save();

    res.json({
      success: true,
      message: `Doctor ${action === 'verify' ? 'verified' : 'rejected'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Upload doctor documents
router.post('/upload-documents', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'medicalLicense', maxCount: 1 },
  { name: 'idDocument', maxCount: 1 },
  { name: 'medicalDegree', maxCount: 1 }
]), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production');
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Doctor access required' });
    }

    // Update user with file paths
    const updateData = {};
    if (req.files.profilePhoto) {
      updateData.profilePhoto = `/uploads/doctor-documents/${req.files.profilePhoto[0].filename}`;
    }
    if (req.files.medicalLicense) {
      updateData.medicalLicense = `/uploads/doctor-documents/${req.files.medicalLicense[0].filename}`;
    }
    if (req.files.idDocument) {
      updateData.idDocument = `/uploads/doctor-documents/${req.files.idDocument[0].filename}`;
    }
    if (req.files.medicalDegree) {
      updateData.medicalDegree = `/uploads/doctor-documents/${req.files.medicalDegree[0].filename}`;
    }

    await User.findByIdAndUpdate(user._id, updateData);

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      documents: updateData
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/doctor-documents', filename);
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('File serving error:', err);
      res.status(404).json({ success: false, message: 'File not found' });
    }
  });
});

module.exports = router;

