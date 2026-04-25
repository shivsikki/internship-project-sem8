const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['doctor', 'admin', 'patient'],
    required: true
  },
  // Doctor specific fields
  specialization: {
    type: String,
    default: ''
  },
  licenseNumber: {
    type: String,
    default: ''
  },
  // Doctor verification fields
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'not_submitted'],
    default: 'not_submitted'
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  medicalLicense: {
    type: String,
    default: ''
  },
  idDocument: {
    type: String,
    default: ''
  },
  medicalDegree: {
    type: String,
    default: ''
  },
  verificationSubmittedAt: {
    type: Date,
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  // Patient specific fields
  age: {
    type: Number,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: null
  },
  phone: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  isOnWatchlist: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

