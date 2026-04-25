const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['appointment', 'test', 'prescription', 'enquiry', 'system', 'chat', 'call'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'urgent', 'none'],
    default: 'none'
  },
  actionPath: {
    type: String, // e.g., '/appointments' or '/tests'
    default: null
  },
  relatedId: {
    type: String,
    default: null
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
