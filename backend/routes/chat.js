const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Test = require('../models/Test');
const auth = require('../middleware/auth');

// @route   GET api/chat/:otherUserId
// @desc    Get message history with a specific user
// @access  Private
router.get('/:otherUserId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.otherUserId;

    const messages = await ChatMessage.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST api/chat/send
// @desc    Send a message
// @access  Private
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const newMessage = new ChatMessage({
      sender: senderId,
      receiver: receiverId,
      content
    });

    await newMessage.save();

    // Create a Notification for the receiver
    const sender = await User.findById(senderId).select('name');
    const notification = new Notification({
      userId: receiverId,
      type: 'chat',
      title: 'New Message',
      message: `${sender.name} sent you a message`,
      sender: senderId,
      actionPath: `/enquiries/chat/${senderId}`, 
      relatedId: newMessage._id
    });
    await notification.save();

    res.status(201).json({ success: true, message: newMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET api/chat/contacts
// @desc    Get list of users who have chatted with current user
// @access  Private
router.get('/contacts/list', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // 1. Get contacts from ChatMessages
    const sentTo = await ChatMessage.distinct('receiver', { sender: userId });
    const receivedFrom = await ChatMessage.distinct('sender', { receiver: userId });
    
    // 2. Get contacts from Appointments
    let appointmentContacts = [];
    if (userRole === 'doctor') {
      appointmentContacts = await Appointment.distinct('patient', { doctor: userId });
    } else if (userRole === 'patient') {
      appointmentContacts = await Appointment.distinct('doctor', { patient: userId });
    }

    // 3. Get contacts from Tests
    let testContacts = [];
    if (userRole === 'doctor') {
      testContacts = await Test.distinct('patient', { doctor: userId });
    } else if (userRole === 'patient') {
      testContacts = await Test.distinct('doctor', { patient: userId });
    }
    
    // Merge and Deduplicate
    const contactIds = [...new Set([
      ...sentTo.map(id => id.toString()), 
      ...receivedFrom.map(id => id.toString()),
      ...appointmentContacts.map(id => id.toString()),
      ...testContacts.map(id => id.toString())
    ])];
    
    const contacts = await User.find({ _id: { $in: contactIds } })
      .select('name role specialization profilePhoto');

    res.json({ success: true, contacts });
  } catch (err) {
    console.error('Contacts fetch error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST api/chat/start-call
// @desc    Notify a user that a video call has started
// @access  Private
router.post('/start-call', auth, async (req, res) => {
  try {
    const { receiverId, roomName } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !roomName) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const sender = await User.findById(senderId).select('name role');
    const receiver = await User.findById(receiverId).select('phone name email');

    const notification = new Notification({
      userId: receiverId,
      type: 'call',
      title: 'Incoming Consultation Call',
      message: `${sender.role === 'doctor' ? 'Dr. ' : ''}${sender.name} is starting a video consultation. Click to join.`,
      sender: senderId,
      actionPath: `/video-call/${roomName}`,
      status: 'urgent',
      relatedId: roomName
    });

    await notification.save();

    // Trigger Automated Formatted Email for Patients
    if (receiver && receiver.email) {
      const { sendConsultationEmail } = require('../utils/emailService');
      await sendConsultationEmail(
        receiver.email, 
        receiver.name, 
        sender.name, 
        roomName
      );
    }

    res.json({ success: true, message: 'Call notification sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
