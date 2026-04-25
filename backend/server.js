const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hippocrates', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB Connected Successfully');
})
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/medivault', require('./routes/medivault'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/users', require('./routes/users'));
app.use('/api/enquiries', require('./routes/enquiries'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

