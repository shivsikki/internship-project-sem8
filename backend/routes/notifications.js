const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Get User Notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, unreadOnly = false } = req.query;

    const query = { user: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      notifications,
      unreadCount: await Notification.countDocuments({ user: userId, isRead: false })
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Mark Notification as Read
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.userId;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Mark All Notifications as Read
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete Notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.userId;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
