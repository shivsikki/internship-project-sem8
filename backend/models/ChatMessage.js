const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  // Future-proofing for multi-channel messaging
  channel: {
    type: String,
    enum: ['app', 'email', 'whatsapp'],
    default: 'app'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups between two users
chatMessageSchema.index({ sender: 1, receiver: 1 });
chatMessageSchema.index({ receiver: 1, sender: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
