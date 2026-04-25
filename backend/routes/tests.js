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
    const { patientId, appointmentId, testType, testName, bodyCheck, testResults, notes, status, images, labResults, testDate } = req.body;
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
      images: images || [],
      labResults: labResults || [],
      testResults: testResults || '',
      notes: notes || '',
      status: status || 'pending',
      testDate: testDate || Date.now()
    });

    await test.save();
    await test.populate('patient', 'name email');
    await test.populate('doctor', 'name specialization');

    // Create Notification for Patient
    const notification = new Notification({
      userId: patientId,
      type: 'test',
      title: status === 'pending' ? 'New Test Requested' : 'Medical Record Added',
      message: status === 'pending' 
        ? `Dr. ${doctor.name} has requested a ${testName}. Please complete it at your earliest convenience.`
        : `Dr. ${doctor.name} has added a new ${testName} record to your profile.`,
      relatedId: test._id,
      actionPath: '/tests',
      status: status === 'pending' ? 'pending' : 'completed'
    });
    await notification.save();

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

// Get Single Test Detail
router.get('/detail/:id', verifyToken, async (req, res) => {
  try {
    const testId = req.params.id;
    const userId = req.userId;

    const test = await Test.findById(testId)
      .populate('patient', 'name email')
      .populate('doctor', 'name specialization');

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const user = await User.findById(userId);
    const isDoctor = user.role === 'doctor' && test.doctor._id.toString() === userId;
    const isPatient = user.role === 'patient' && test.patient._id.toString() === userId;
    const isAdmin = user.role === 'admin';

    if (!isDoctor && !isPatient && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, test });
  } catch (error) {
    console.error('Get test detail error:', error);
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

// Update Test
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { testResults, notes, status, bodyCheck, images, labResults, testDate } = req.body;
    const testId = req.params.id;
    const userId = req.userId;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const user = await User.findById(userId);
    const isDoctor = user.role === 'doctor' && test.doctor.toString() === userId;
    const isAdmin = user.role === 'admin';
    const isPatient = user.role === 'patient' && test.patient.toString() === userId;

    if (!isDoctor && !isAdmin && !isPatient) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Patients can only update results, notes, images, and set status to completed
    if (isPatient) {
      if (testResults !== undefined) test.testResults = testResults;
      if (notes !== undefined) test.notes = notes;
      if (images !== undefined) test.images = images;
      if (status === 'completed') test.status = 'completed';
      
      // Notify doctor
      const doctorNotification = new Notification({
        userId: test.doctor,
        type: 'test',
        title: 'Test Results Uploaded',
        message: `${user.name} has uploaded results for "${test.testName}".`,
        relatedId: test._id,
        actionPath: `/tests/results/${test._id}`,
        status: 'completed'
      });
      await doctorNotification.save();
    } else {
      // Doctor/Admin can update everything
      if (testResults !== undefined) test.testResults = testResults;
      if (notes !== undefined) test.notes = notes;
      if (status !== undefined) test.status = status;
      if (bodyCheck !== undefined) test.bodyCheck = bodyCheck;
      if (images !== undefined) test.images = images;
      if (labResults !== undefined) test.labResults = labResults;
      if (testDate !== undefined) test.testDate = testDate;
    }

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

