const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const User = require('../models/User');
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

// Create Prescription (Doctor)
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { patientId, appointmentId, medications, diagnosis, notes } = req.body;
    const doctorId = req.userId;

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can create prescriptions' });
    }

    if (!patientId || !medications || !diagnosis) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const prescription = new Prescription({
      patient: patientId,
      doctor: doctorId,
      appointment: appointmentId || null,
      medications,
      diagnosis,
      notes: notes || ''
    });

    await prescription.save();
    await prescription.populate('patient', 'name email');
    await prescription.populate('doctor', 'name specialization');

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      prescription
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get Patient Prescriptions
router.get('/patient/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.userId;
    const user = await User.findById(userId);

    // Check permissions
    const isPatient = user.role === 'patient' && patientId === userId;
    const isDoctor = user.role === 'doctor';
    const isAdmin = user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const prescriptions = await Prescription.find({ patient: patientId })
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ date: -1 });

    res.json({ success: true, prescriptions });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get Doctor's Prescriptions
router.get('/doctor', verifyToken, async (req, res) => {
  try {
    const doctorId = req.userId;
    const doctor = await User.findById(doctorId);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can view this' });
    }

    const prescriptions = await Prescription.find({ doctor: doctorId })
      .populate('patient', 'name email phone age')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ date: -1 });

    res.json({ success: true, prescriptions });
  } catch (error) {
    console.error('Get doctor prescriptions error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get All Prescriptions (Admin)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can view all prescriptions' });
    }

    const prescriptions = await Prescription.find()
      .populate('patient', 'name email phone age')
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ date: -1 });

    res.json({ success: true, prescriptions });
  } catch (error) {
    console.error('Get all prescriptions error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;

