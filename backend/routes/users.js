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

// @route   PUT api/users/:id/suspend
// @desc    Suspend/Unsuspend a user
// @access  Admin only
router.put('/:id/suspend', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   PUT api/users/:id/watchlist
// @desc    Toggle watchlist status
// @access  Admin only
router.put('/:id/watchlist', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isOnWatchlist = !user.isOnWatchlist;
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
