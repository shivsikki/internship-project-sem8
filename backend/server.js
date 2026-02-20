const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup (basic, for chat/alerts/notifications)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  // Join room per user or doctor-patient pair
  socket.on('join', (roomId) => {
    socket.join(roomId);
  });

  socket.on('chat:send', (payload) => {
    const { roomId, message } = payload || {};
    if (!roomId || !message) return;
    io.to(roomId).emit('chat:message', {
      roomId,
      message,
      at: new Date().toISOString(),
    });
  });

  socket.on('emergency:alert', (payload) => {
    // Broadcast to admins/doctors; in a real system this would filter by role.
    io.emit('emergency:alert', {
      ...payload,
      at: new Date().toISOString(),
    });
  });

  socket.on('webrtc:signal', (payload) => {
    const { roomId } = payload || {};
    if (!roomId) return;
    socket.to(roomId).emit('webrtc:signal', payload);
  });
});

// Attach io to app so routes could use it if needed
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
let mongoConnected = false;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management')
.then(() => {
  mongoConnected = true;
  console.log('✅ MongoDB Connected Successfully');
})
.catch((err) => {
  mongoConnected = false;
  console.error('❌ MongoDB Connection Error:', err.message);
  console.error('⚠️  Please start MongoDB:');
  console.error('   1. Run: net start MongoDB (as Administrator)');
  console.error('   2. Or: mongod --dbpath "C:\\data\\db"');
  console.error('   3. Or install MongoDB from: https://www.mongodb.com/try/download/community');
});

// MongoDB connection status middleware
app.use((req, res, next) => {
  if (!mongoConnected && req.path.startsWith('/api/')) {
    return res.status(503).json({
      success: false,
      message: 'Database not connected. Please start MongoDB and restart the server.',
      error: 'MongoDB connection required'
    });
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: mongoConnected ? 'OK' : 'WARNING',
    message: mongoConnected ? 'Server is running' : 'Server running but MongoDB not connected',
    mongoConnected,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server + Socket.io running on port ${PORT}`);
});

