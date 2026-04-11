const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AdminAccessToken = require('../models/AdminAccessToken');
const AdminConfig = require('../models/AdminConfig');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production', {
    expiresIn: '30d'
  });
};

const TOKEN_EXPIRY_MINUTES = 5;

// Initialize admin config on module load
(async () => {
  try {
    await AdminConfig.initialize();
  } catch (err) {
    console.error('Failed to initialize admin config:', err);
  }
})();

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

    // For doctors, check verification status
    if (user.role === 'doctor') {
      // If doctor hasn't submitted verification or is rejected, still allow login but flag it
      // If pending verification, also allow login but flag it
      const verificationRequired = !user.isVerified;
      
      const token = generateToken(user._id);

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        verificationRequired,
        verificationStatus: user.verificationStatus,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          specialization: user.specialization,
          licenseNumber: user.licenseNumber,
          isVerified: user.isVerified,
          verificationStatus: user.verificationStatus
        }
      });
    }

    // For admin users, generate temporary access token instead of immediate login
    if (user.role === 'admin') {
      // Generate secure token
      const tempToken = AdminAccessToken.generateToken();
      
      // Calculate expiry time
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
      
      // Store in database, bound to this specific user
      const accessToken = new AdminAccessToken({
        token: tempToken,
        userId: user._id,
        expiresAt: expiresAt,
        used: false
      });
      await accessToken.save();

      return res.json({
        success: true,
        pending: true,
        tempToken,
        expiresIn: TOKEN_EXPIRY_MINUTES * 60,
        message: 'Admin verification required'
      });
    }

    // Generate token for non-admin users
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

// Verify admin token is valid (GET)
router.get('/admin-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find token in database
    const tokenData = await AdminAccessToken.findOne({ token });

    if (!tokenData) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Check if expired or already used
    if (tokenData.isExpired() || tokenData.used) {
      // Delete if expired/used
      await AdminAccessToken.deleteOne({ token });
      return res.status(404).json({
        success: false,
        message: 'Token has expired'
      });
    }

    // Calculate remaining time
    const expiresIn = Math.max(0, Math.floor((tokenData.expiresAt - Date.now()) / 1000));

    res.json({
      success: true,
      valid: true,
      expiresIn
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Complete admin login with secondary password (POST)
router.post('/admin-verify', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password required'
      });
    }

    // Find token in database
    const tokenData = await AdminAccessToken.findOne({ token });

    if (!tokenData) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Check if expired or already used
    if (tokenData.isExpired() || tokenData.used) {
      await AdminAccessToken.deleteOne({ token });
      return res.status(404).json({
        success: false,
        message: 'Token has expired'
      });
    }

    // Verify secondary password against hashed password in DB
    const adminConfig = await AdminConfig.findOne();
    if (!adminConfig) {
      return res.status(500).json({
        success: false,
        message: 'Admin configuration not found'
      });
    }

    const isPasswordValid = await adminConfig.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin password'
      });
    }

    // Mark token as used (one-time use)
    tokenData.used = true;
    await tokenData.save();

    // Get user and generate JWT
    const user = await User.findById(tokenData.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const jwtToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Admin login successful',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
});

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Get all pending doctors (admin only)
router.get('/pending-doctors', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const pendingDoctors = await User.find({
      role: 'doctor',
      verificationStatus: { $in: ['pending', 'not_submitted'] }
    }).select('-password');

    res.json({
      success: true,
      doctors: pendingDoctors
    });
  } catch (error) {
    console.error('Fetch pending doctors error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Submit doctor verification documents
router.post('/submit-verification', authenticate, async (req, res) => {
  try {
    const { profilePhoto, medicalLicense, idDocument, medicalDegree } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Access denied. Doctor only.' });
    }

    // Update user with document URLs and verification status
    user.profilePhoto = profilePhoto || user.profilePhoto;
    user.medicalLicense = medicalLicense || user.medicalLicense;
    user.idDocument = idDocument || user.idDocument;
    user.medicalDegree = medicalDegree || user.medicalDegree;
    user.verificationStatus = 'pending';
    user.verificationSubmittedAt = new Date();
    
    await user.save();

    res.json({
      success: true,
      message: 'Verification documents submitted successfully. Waiting for admin approval.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (error) {
    console.error('Submit verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify or reject doctor (admin only)
router.post('/verify-doctor', authenticate, async (req, res) => {
  try {
    const { doctorId, action } = req.body;
    
    if (!doctorId || !action || !['verify', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid request. Provide doctorId and action (verify/reject).' });
    }

    const admin = await User.findById(req.userId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (action === 'verify') {
      doctor.isVerified = true;
      doctor.verificationStatus = 'verified';
      doctor.verifiedAt = new Date();
    } else {
      doctor.isVerified = false;
      doctor.verificationStatus = 'rejected';
    }

    await doctor.save();

    res.json({
      success: true,
      message: `Doctor ${action === 'verify' ? 'verified' : 'rejected'} successfully`,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        verificationStatus: doctor.verificationStatus,
        isVerified: doctor.isVerified
      }
    });
  } catch (error) {
    console.error('Verify doctor error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get doctor verification status
router.get('/verification-status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user || user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Access denied. Doctor only.' });
    }

    res.json({
      success: true,
      verificationStatus: user.verificationStatus,
      isVerified: user.isVerified,
      documents: {
        profilePhoto: user.profilePhoto,
        medicalLicense: user.medicalLicense,
        idDocument: user.idDocument,
        medicalDegree: user.medicalDegree
      }
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

