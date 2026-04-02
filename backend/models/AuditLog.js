const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminName: String,
  action: {
    type: String,
    required: true
  },
  targetType: String, // 'User', 'Appointment', 'Test', etc.
  targetId: mongoose.Schema.Types.ObjectId,
  details: String,
  ip: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
