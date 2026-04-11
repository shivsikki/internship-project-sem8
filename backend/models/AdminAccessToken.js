const mongoose = require('mongoose');
const crypto = require('crypto');

const AdminAccessTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate secure random token
AdminAccessTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
};

// Check if token is expired
AdminAccessTokenSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// TTL index to auto-delete expired tokens
AdminAccessTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AdminAccessToken', AdminAccessTokenSchema);
