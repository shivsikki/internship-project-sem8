const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET api/users/list
// @desc    Get users for clinical discovery (Doctors see Patients, Patients see Doctors)
// @access  Private
router.get('/list', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let query = {};
    if (currentUser.role === 'patient') {
      // Patients look for Doctors
      query = { role: 'doctor' };
    } else if (currentUser.role === 'doctor') {
      // Doctors look for Patients
      query = { role: 'patient' };
    } else {
      // Admins see everyone
      query = { _id: { $ne: currentUser._id } };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ name: 1 });

    res.json({
      success: true,
      users
    });
  } catch (err) {
    console.error('Error fetching users for discovery:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
