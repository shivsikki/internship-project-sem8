const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const Announcement = require('../models/Announcement');
const Config = require('../models/Config');
const { protect, authorize } = require('../middleware/authMiddleware');

// Helper to create audit logs
const logAdminAction = async (admin, action, targetType, targetId, details) => {
  try {
    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.name,
      action,
      targetType,
      targetId,
      details
    });
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
};

// Ensure all routes require token and admin role
router.use(protect);
router.use(authorize('admin'));

// Middleware specifically for Root Admin operations
const requireRootAdmin = (req, res, next) => {
  if (!req.user.isRootAdmin) {
    return res.status(403).json({ success: false, message: 'Forbidden. Root Admin access required.' });
  }
  next();
};

// --- Root Admin Only Routes ---

// Get pending admin requests
router.get('/pending-admins', requireRootAdmin, async (req, res) => {
  try {
    const pendingAdmins = await User.find({ role: 'admin', isApproved: false }).select('-password');
    res.json({ success: true, count: pendingAdmins.length, data: pendingAdmins });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Approve admin
router.post('/approve-admin/:id', requireRootAdmin, async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    admin.isApproved = true;
    await admin.save();
    
    await logAdminAction(req.user, 'APPROVE_ADMIN', 'User', admin._id, `Approved admin: ${admin.email}`);
    
    res.json({ success: true, message: 'Admin approved successfully', data: admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Reject/Delete admin
router.delete('/reject-admin/:id', requireRootAdmin, async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    await logAdminAction(req.user, 'REJECT_ADMIN', 'User', req.params.id, `Rejected/Deleted admin: ${admin.email}`);
    
    res.json({ success: true, message: 'Admin rejected and removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// --- General Admin Routes ---

// Get stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalAppointments = await Appointment.countDocuments();
    
    // Aggregation for total revenue
    const revenueMatch = await Payment.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueMatch.length > 0 ? revenueMatch[0].total : 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalRevenue
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    const users = await User.find(filter).select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Delete user
router.delete('/users/:id', requireRootAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
       return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }
    const userToDelete = await User.findById(req.params.id);
    await User.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user, 'DELETE_USER', 'User', req.params.id, `Deleted user: ${userToDelete?.email || 'unknown'}`);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get all appointments
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('doctor', 'name').populate('patient', 'name').sort({ date: -1 });
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// --- Advanced Admin Suite ---

// 1. Advanced Analytics
router.get('/analytics', async (req, res) => {
  try {
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'captured' } },
      {
        $group: {
          _id: { $month: '$createdAt' },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const userDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const appointmentTrends = await Appointment.aggregate([
      {
        $group: {
          _id: '$appointmentDate',
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': -1 } },
      { $limit: 15 }
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue,
        userDistribution,
        appointmentTrends
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Audit Logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Announcements (Broadcasts)
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, content, priority } = req.body;
    const ann = await Announcement.create({ title, content, priority, createdBy: req.user.id });
    await logAdminAction(req.user, 'CREATE_ANNOUNCEMENT', 'Announcement', ann._id, `Title: ${title}`);
    res.json({ success: true, data: ann });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user, 'DELETE_ANNOUNCEMENT', 'Announcement', req.params.id, '');
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Config & Settings
router.get('/config', async (req, res) => {
  try {
    const configs = await Config.find();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/config', async (req, res) => {
  try {
    const { key, value } = req.body;
    const config = await Config.findOneAndUpdate(
      { key },
      { value, updatedBy: req.user.id, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    await logAdminAction(req.user, 'UPDATE_CONFIG', 'Config', config._id, `${key} changed`);
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. User Management Extension (Suspension)
router.post('/users/:id/toggle-suspension', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    user.isSuspended = !user.isSuspended;
    await user.save();
    
    await logAdminAction(
      req.user, 
      user.isSuspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER', 
      'User', 
      user._id, 
      `User ${user.email} ${user.isSuspended ? 'suspended' : 'reinstated'}`
    );

    res.json({ success: true, isSuspended: user.isSuspended });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get specific user's full activity (Appointments, Prescriptions, Tests)
router.get('/users/:id/activity', requireRootAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const userRole = await User.findById(userId).select('role name email');
    if (!userRole) return res.status(404).json({ success: false, message: 'User not found' });

    const isPatient = userRole.role === 'patient';
    const isDoctor = userRole.role === 'doctor';

    // We only fetch history for patients and doctors
    let appointments = [];
    let tests = [];
    
    // We intentionally load Prescriptions model which might not have been imported yet
    const Prescription = require('../models/Prescription');
    const Test = require('../models/Test');

    if (isPatient) {
      appointments = await Appointment.find({ patient: userId }).populate('doctor', 'name specialization').sort({ date: -1 });
      const prescriptions = await Prescription.find({ patient: userId }).populate('doctor', 'name').sort({ date: -1 });
      tests = await Test.find({ patient: userId }).populate('doctor', 'name').sort({ date: -1 });
      
      return res.json({ success: true, user: userRole, data: { appointments, prescriptions, tests } });
    } else if (isDoctor) {
      appointments = await Appointment.find({ doctor: userId }).populate('patient', 'name').sort({ date: -1 });
      const prescriptions = await Prescription.find({ doctor: userId }).populate('patient', 'name').sort({ date: -1 });
      tests = await Test.find({ doctor: userId }).populate('patient', 'name').sort({ date: -1 });
      
      return res.json({ success: true, user: userRole, data: { appointments, prescriptions, tests } });
    } else {
      return res.json({ success: true, user: userRole, data: { appointments: [], prescriptions: [], tests: [] } });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
