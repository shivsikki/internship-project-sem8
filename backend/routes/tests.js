const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const User = require('../models/User');
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

// Create Test/Medical Record (Doctor)
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { patientId, appointmentId, testType, testName, bodyCheck, testResults, notes, status, timerDuration, maxScore } = req.body;
    const doctorId = req.userId;

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can create tests' });
    }

    if (!patientId || !testType || !testName) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const test = new Test({
      patient: patientId,
      doctor: doctorId,
      appointment: appointmentId || null,
      testType,
      testName,
      bodyCheck: bodyCheck || {},
      testResults: testResults || '',
      notes: notes || '',
      status: status || 'pending',
      timerDuration: timerDuration || null,
      maxScore: maxScore || null
    });

    await test.save();
    await test.populate('patient', 'name email');
    await test.populate('doctor', 'name specialization');

    // Create notification for patient
    const notification = new Notification({
      user: patientId,
      type: 'test_available',
      title: 'New Test Available',
      message: `Dr. ${doctor.name} has assigned you a new test: ${testName}`,
      relatedId: test._id,
      relatedType: 'test'
    });
    await notification.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('test:updated', {
        action: 'created',
        test: test,
        userId: patientId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Test record created successfully',
      test
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get Patient Tests
router.get('/patient/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.userId;
    const user = await User.findById(userId);

    const isPatient = user.role === 'patient' && patientId === userId;
    const isDoctor = user.role === 'doctor';
    const isAdmin = user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tests = await Test.find({ patient: patientId })
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ testDate: -1 });

    res.json({ success: true, tests });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get Doctor's Tests
router.get('/doctor', verifyToken, async (req, res) => {
  try {
    const doctorId = req.userId;
    const doctor = await User.findById(doctorId);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can view this' });
    }

    const tests = await Test.find({ doctor: doctorId })
      .populate('patient', 'name email phone age')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ testDate: -1 });

    res.json({ success: true, tests });
  } catch (error) {
    console.error('Get doctor tests error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Start Test (Patient)
router.post('/:id/start', verifyToken, async (req, res) => {
  try {
    const testId = req.params.id;
    const userId = req.userId;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    if (test.patient.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (test.isSubmitted) {
      return res.status(400).json({ success: false, message: 'Test already submitted' });
    }

    if (test.status === 'in_progress' && test.startTime) {
      return res.json({ success: true, message: 'Test already started', test });
    }

    test.status = 'in_progress';
    test.startTime = new Date();
    await test.save();

    await test.populate('patient', 'name email');
    await test.populate('doctor', 'name specialization');

    res.json({ success: true, message: 'Test started', test });
  } catch (error) {
    console.error('Start test error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Submit Test (Patient)
router.post('/:id/submit', verifyToken, async (req, res) => {
  try {
    const { testResults, bodyCheck } = req.body;
    const testId = req.params.id;
    const userId = req.userId;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    if (test.patient.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (test.isSubmitted) {
      return res.status(400).json({ success: false, message: 'Test already submitted' });
    }

    // Calculate score if maxScore is set
    let score = null;
    if (test.maxScore && testResults) {
      // Simple scoring: count non-empty body check fields and test results
      let points = 0;
      if (bodyCheck) {
        const bodyCheckFields = Object.values(bodyCheck).filter(v => v && v.trim() !== '');
        points += bodyCheckFields.length * 5; // 5 points per field
      }
      if (testResults && testResults.trim() !== '') {
        points += 50; // 50 points for test results
      }
      score = Math.min(points, test.maxScore);
    }

    test.testResults = testResults || test.testResults;
    if (bodyCheck) test.bodyCheck = bodyCheck;
    test.status = 'completed';
    test.isSubmitted = true;
    test.submittedAt = new Date();
    if (score !== null) test.score = score;

    await test.save();
    await test.populate('patient', 'name email');
    await test.populate('doctor', 'name specialization');

    // Create notification for doctor
    const notification = new Notification({
      user: test.doctor._id,
      type: 'test_completed',
      title: 'Test Completed',
      message: `${test.patient.name} has completed the test: ${test.testName}`,
      relatedId: test._id,
      relatedType: 'test'
    });
    await notification.save();

    // Create notification for patient
    const patientNotification = new Notification({
      user: userId,
      type: 'test_result',
      title: 'Test Submitted',
      message: `Your test "${test.testName}" has been submitted successfully${score !== null ? `. Score: ${score}/${test.maxScore}` : ''}`,
      relatedId: test._id,
      relatedType: 'test'
    });
    await patientNotification.save();

    res.json({ success: true, message: 'Test submitted successfully', test });
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update Test
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { testResults, notes, status, bodyCheck, timerDuration, maxScore } = req.body;
    const testId = req.params.id;
    const userId = req.userId;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const user = await User.findById(userId);
    const isDoctor = user.role === 'doctor' && test.doctor.toString() === userId;
    const isAdmin = user.role === 'admin';

    if (!isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (test.isSubmitted && (testResults !== undefined || bodyCheck !== undefined)) {
      return res.status(400).json({ success: false, message: 'Cannot modify submitted test' });
    }

    if (testResults !== undefined) test.testResults = testResults;
    if (notes !== undefined) test.notes = notes;
    if (status !== undefined) test.status = status;
    if (bodyCheck !== undefined) test.bodyCheck = bodyCheck;
    if (timerDuration !== undefined) test.timerDuration = timerDuration;
    if (maxScore !== undefined) test.maxScore = maxScore;

    await test.save();
    await test.populate('patient', 'name email');
    await test.populate('doctor', 'name specialization');

    res.json({ success: true, message: 'Test updated successfully', test });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;

