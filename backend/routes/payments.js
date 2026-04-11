const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
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

// Create Razorpay Order
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    const { amount, appointmentId, description } = req.body;
    const userId = req.userId;

    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // Get Razorpay credentials from environment
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(500).json({ 
        success: false, 
        message: 'Payment gateway not configured. Please contact administrator.' 
      });
    }

    // Create order using Razorpay API
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret
    });

    const options = {
      amount: amount, // amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${userId}`,
      notes: {
        userId: userId.toString(),
        appointmentId: appointmentId || '',
        description: description || 'Payment'
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create payment order',
      error: error.message 
    });
  }
});

// Verify Razorpay Payment
router.post('/verify', verifyToken, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      amount,
      appointmentId,
      paymentType,
      paymentMethod
    } = req.body;
    const userId = req.userId;

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeySecret) {
      return res.status(500).json({ 
        success: false, 
        message: 'Payment gateway not configured' 
      });
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed - Invalid signature' 
      });
    }

    // Update appointment payment status if applicable
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (appointment && appointment.patient.toString() === userId) {
        appointment.paymentStatus = 'paid';
        await appointment.save();
      }
    }

    // Create payment record
    const payment = new Payment({
      patient: userId,
      appointment: appointmentId || null,
      amount: amount,
      paymentType: paymentType || 'appointment',
      paymentMethod: paymentMethod || 'online',
      status: 'paid',
      paidAt: new Date(),
      transactionId: razorpay_payment_id,
      description: `Razorpay Payment - Order: ${razorpay_order_id}`
    });

    await payment.save();
    await payment.populate('patient', 'name email');
    await payment.populate('appointment', 'appointmentDate appointmentTime');

    res.json({
      success: true,
      message: 'Payment verified and processed successfully',
      payment
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed',
      error: error.message 
    });
  }
});

// Create Payment (Manual/Cash)
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { appointmentId, amount, paymentType, paymentMethod, description } = req.body;
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!amount || !paymentType) {
      return res.status(400).json({ success: false, message: 'Please provide amount and payment type' });
    }

    // If appointment payment, update appointment payment status
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (appointment && appointment.patient.toString() === userId) {
        appointment.paymentStatus = 'paid';
        await appointment.save();
      }
    }

    const payment = new Payment({
      patient: userId,
      appointment: appointmentId || null,
      amount,
      paymentType,
      paymentMethod: paymentMethod || 'cash',
      description: description || '',
      status: 'paid',
      paidAt: new Date(),
      transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    });

    await payment.save();
    await payment.populate('patient', 'name email');
    await payment.populate('appointment', 'appointmentDate appointmentTime');

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      payment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get Patient Payments
router.get('/patient', verifyToken, async (req, res) => {
  try {
    const patientId = req.userId;
    const payments = await Payment.find({ patient: patientId })
      .populate('appointment', 'appointmentDate appointmentTime reason')
      .sort({ createdAt: -1 });

    res.json({ success: true, payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get All Payments (Admin)
router.get('/all', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can view all payments' });
    }

    const payments = await Payment.find()
      .populate('patient', 'name email')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ createdAt: -1 });

    // Calculate total revenue
    const totalRevenue = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      payments,
      totalRevenue
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;

