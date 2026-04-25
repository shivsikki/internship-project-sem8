const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

// Middleware to verify token
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

// Create Appointment (Patient)
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, reason, city } = req.body;
    const patientId = req.userId;

    // Validation
    if (!doctorId || !appointmentDate || !appointmentTime || !reason || !city) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can book appointments'
      });
    }

    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor selected'
      });
    }

    // Check if appointment time slot is available
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      reason,
      city,
      status: 'pending'
    });

    await appointment.save();

    // Populate patient and doctor details
    await appointment.populate('patient', 'name email phone');
    await appointment.populate('doctor', 'name email specialization');

    // Create Notification for Doctor
    const notification = new Notification({
      userId: doctorId,
      type: 'appointment',
      title: reason === 'Planned Call' ? 'Planned Call Request' : 'New Appointment Booking',
      message: reason === 'Planned Call' 
        ? 'You got a planned call request' 
        : `${patient.name} has scheduled a new appointment in ${city} for ${appointmentTime} on ${appointmentDate}. Reason: ${reason}`,
      relatedId: appointment._id,
      actionPath: reason === 'Planned Call' ? null : '/appointments',
      status: 'pending'
    });
    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get Linked Doctors (for E-Consultation Discovery)
router.get('/linked-clinicians', verifyToken, async (req, res) => {
  try {
    const patientId = req.userId;
    
    // Fetch ALL appointments (ignoring the filter for planned calls)
    const appointments = await Appointment.find({ patient: patientId })
      .populate('doctor', 'name email specialization profilePhoto role')
      .sort({ createdAt: -1 });

    const linkedDoctors = [];
    const doctorIds = new Set();
    
    appointments.forEach(app => {
      if (app.doctor && !doctorIds.has(app.doctor._id.toString())) {
        doctorIds.add(app.doctor._id.toString());
        linkedDoctors.push(app.doctor);
      }
    });

    res.json({
      success: true,
      doctors: linkedDoctors
    });
  } catch (error) {
    console.error('Get linked clinicians error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Appointments (Patient - their own appointments)
router.get('/patient', verifyToken, async (req, res) => {
  try {
    const patientId = req.userId;

    const appointments = await Appointment.find({ 
      patient: patientId,
      reason: { $ne: 'Planned Call' } 
    })
      .populate('doctor', 'name email specialization licenseNumber')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get Appointments (Doctor - their appointments)
router.get('/doctor', verifyToken, async (req, res) => {
  try {
    const doctorId = req.userId;

    const appointments = await Appointment.find({ 
      doctor: doctorId,
      reason: { $ne: 'Planned Call' }
    })
      .populate('patient', 'name email phone age gender address')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get All Appointments (Admin)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can view all appointments'
      });
    }

    const appointments = await Appointment.find()
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization')
      .sort({ appointmentDate: -1, appointmentTime: -1 });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Get all appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update Appointment Status (Doctor/Admin)
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status, notes, fee, appointmentDate, appointmentTime } = req.body;
    const appointmentId = req.params.id;
    const userId = req.userId;

    const user = await User.findById(userId);
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions
    const isDoctor = user.role === 'doctor' && appointment.doctor.toString() === userId;
    const isAdmin = user.role === 'admin';

    if (!isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this appointment'
      });
    }

    // Update appointment
    if (status) {
      if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }
      appointment.status = status;
    }

    if (appointmentDate) appointment.appointmentDate = appointmentDate;
    if (appointmentTime) appointment.appointmentTime = appointmentTime;

    if (notes !== undefined) {
      appointment.notes = notes;
    }

    if (fee !== undefined) {
      appointment.fee = fee;
    }

    await appointment.save();

    await appointment.populate('patient', 'name email phone');
    await appointment.populate('doctor', 'name email specialization');

    // Create Notification for Patient
    const isPlannedCall = appointment.reason === 'Planned Call';
    const typeLabel = isPlannedCall ? 'Planned Call' : 'Appointment';
    const msgLabel = isPlannedCall ? 'planned call' : 'appointment';
    const actionLabel = status.charAt(0).toUpperCase() + status.slice(1);

    const notification = new Notification({
      userId: appointment.patient._id,
      type: 'appointment',
      title: `${typeLabel} ${actionLabel}`,
      message: `Your ${msgLabel} with Dr. ${appointment.doctor.name} on ${new Date(appointment.appointmentDate).toLocaleDateString()} has been ${status}.`,
      relatedId: appointment._id,
      actionPath: isPlannedCall ? null : '/appointments',
      status: status === 'confirmed' ? 'completed' : status === 'cancelled' ? 'cancelled' : 'none'
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get Single Appointment
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.userId;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email phone age gender address')
      .populate('doctor', 'name email specialization licenseNumber');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const user = await User.findById(userId);

    // Check permissions
    const isPatient = user.role === 'patient' && appointment.patient._id.toString() === userId;
    const isDoctor = user.role === 'doctor' && appointment.doctor._id.toString() === userId;
    const isAdmin = user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this appointment'
      });
    }

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get All Doctors (for patient to select)
// Optional query: ?specialization=Cardiology (case-insensitive partial match)
router.get('/doctors/list', verifyToken, async (req, res) => {
  try {
    const { specialization, city } = req.query;
    const filter = { role: 'doctor', isVerified: true }; // Ensure only verified doctors appear

    if (specialization && specialization.trim() && specialization !== 'All') {
      filter.specialization = { $regex: specialization.trim(), $options: 'i' };
    }

    if (city && city.trim()) {
      filter.city = { $regex: city.trim(), $options: 'i' };
    }

    const doctors = await User.find(filter)
      .select('name email specialization licenseNumber')
      .sort({ name: 1 });

    res.json({
      success: true,
      doctors
    });
  } catch (error) {
    console.error('Get doctors list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;

