const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminConfigSchema = new mongoose.Schema({
  accessPassword: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
AdminConfigSchema.pre('save', async function(next) {
  if (this.isModified('accessPassword')) {
    this.accessPassword = await bcrypt.hash(this.accessPassword, 10);
  }
  this.updatedAt = Date.now();
  next();
});

// Method to compare password
AdminConfigSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.accessPassword);
};

// Static method to initialize with default password
AdminConfigSchema.statics.initialize = async function() {
  const existing = await this.findOne();
  if (!existing) {
    // Create with default password - CHANGE THIS IN PRODUCTION
    const config = new this({
      accessPassword: 'admin123'
    });
    await config.save();
    console.log('AdminConfig initialized with default password');
  }
};

module.exports = mongoose.model('AdminConfig', AdminConfigSchema);
