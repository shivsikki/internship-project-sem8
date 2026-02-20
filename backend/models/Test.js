const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  testType: {
    type: String,
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  bodyCheck: {
    type: {
      bloodPressure: String,
      heartRate: String,
      temperature: String,
      weight: String,
      height: String,
      bmi: String,
      oxygenLevel: String,
      other: String
    },
    default: {}
  },
  testResults: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  timerDuration: {
    type: Number, // Duration in minutes
    default: null
  },
  startTime: {
    type: Date,
    default: null
  },
  submittedAt: {
    type: Date,
    default: null
  },
  isSubmitted: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    default: null
  },
  maxScore: {
    type: Number,
    default: null
  },
  testDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Test', testSchema);

