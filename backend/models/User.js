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
  // Doctor verification documents
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
  address: {
    type: String,
    default: ''
  },
  isRootAdmin: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: function() {
      return this.role !== 'doctor';
    }
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: function() {
      return this.role === 'doctor' ? 'pending' : 'verified';
    }
  },
  isSuspended: {
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

