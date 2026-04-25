const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Test = require('../models/Test');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');

// @route   GET api/enquiries
// @desc    Get all enquiries for a user (context-aware)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let enquiries;
    if (userRole === 'patient') {
      enquiries = await Enquiry.find({ patient: userId }).populate('doctor', 'name specialization').sort({ createdAt: -1 });
    } else if (userRole === 'doctor') {
      enquiries = await Enquiry.find({ doctor: userId }).populate('patient', 'name email phone').sort({ createdAt: -1 });
    } else {
      enquiries = await Enquiry.find().populate('patient doctor', 'name').sort({ createdAt: -1 });
    }

    res.json({ success: true, enquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST api/enquiries
// @desc    Create a new enquiry (Patient)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { doctorId, subject, message } = req.body;
    const patientId = req.user.id;

    if (!doctorId || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const enquiry = new Enquiry({
      patient: patientId,
      doctor: doctorId,
      subject,
      message
    });

    await enquiry.save();

    // Create Notification for Doctor
    const patient = await User.findById(patientId);
    const notification = new Notification({
      userId: doctorId,
      type: 'enquiry',
      title: 'New Patient Inquiry',
      message: `${patient.name} has sent a new inquiry: "${subject}"`,
      relatedId: enquiry._id,
      actionPath: `/enquiries/chat/${patientId}`
    });
    await notification.save();

    res.status(201).json({ success: true, enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   PUT api/enquiries/:id/reply
// @desc    Reply to an enquiry (Doctor)
// @access  Private
router.put('/:id/reply', auth, async (req, res) => {
  try {
    const { reply } = req.body;
    const doctorId = req.user.id;

    if (!reply) {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }

    const enquiry = await Enquiry.findOne({ _id: req.params.id, doctor: doctorId });
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found or access denied' });
    }

    enquiry.reply = reply;
    enquiry.status = 'replied';
    enquiry.repliedAt = Date.now();

    await enquiry.save();

    // Create Notification for Patient
    const doctor = await User.findById(doctorId);
    const notification = new Notification({
      userId: enquiry.patient,
      type: 'enquiry',
      title: 'Physician Response Recieved',
      message: `Dr. ${doctor.name} has replied to your inquiry: "${enquiry.subject}"`,
      relatedId: enquiry._id,
      actionPath: `/enquiries/chat/${doctorId}`
    });
    await notification.save();

    res.json({ success: true, enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET api/enquiries/pending-data
// @desc    Get pending tests and upcoming sessions for the Hub
// @access  Private
router.get('/pending-data', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let pendingTests = [];
    let upcomingSessions = [];

    // 1. Fetch Pending Tests
    if (userRole === 'doctor') {
      pendingTests = await Test.find({ doctor: userId, status: 'pending' })
        .populate('patient', 'name email profilePhoto')
        .sort({ testDate: -1 });
    } else {
      pendingTests = await Test.find({ patient: userId, status: 'pending' })
        .populate('doctor', 'name specialization profilePhoto')
        .sort({ testDate: -1 });
    }

    // 2. Fetch Upcoming Video Sessions (Appointments with status 'confirmed' or 'pending')
    // and occurring today or in future.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionQuery = {
      status: 'pending',
      reason: 'Planned Call', // ONLY Planned Calls should be in the Hub
      appointmentDate: { $gte: today }
    };

    if (userRole === 'doctor') {
      sessionQuery.doctor = userId;
    } else {
      sessionQuery.patient = userId;
    }

    upcomingSessions = await Appointment.find(sessionQuery)
      .populate(userRole === 'doctor' ? 'patient' : 'doctor', 'name specialization profilePhoto')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(5);

    res.json({ 
      success: true, 
      pending: {
        tests: pendingTests,
        sessions: upcomingSessions
      }
    });
  } catch (err) {
    console.error('Pending data fetch error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
