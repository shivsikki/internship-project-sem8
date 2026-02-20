# Hospital Management System

A comprehensive full-stack hospital management system built with React (frontend) and Node.js/Express (backend), featuring real-time communication, role-based access control, and modern UI/UX.

## Features

### Core Functionality
- **User Authentication**: Secure login/signup with JWT tokens for Admin, Doctor, and Patient roles
- **Appointment Management**: Book, view, and manage appointments with status tracking (pending, confirmed, completed)
- **Test Module**: Create timed tests with automatic submission and scoring system
- **Prescription Management**: Doctors can create and manage prescriptions for patients
- **Payment Integration**: Razorpay integration for payment processing
- **Real-time Notifications**: Socket.io-based notification system for appointment confirmations, test results, etc.

### Advanced Features
- **Real-time Chat**: Socket.io-powered chat system for doctor-patient communication
- **Emergency Alerts**: Emergency button with geolocation sharing and nearby hospitals map
- **Profile Management**: Users can update their profile and change passwords
- **Dark Mode**: Toggle between light and dark themes
- **CSV Export**: Export appointment data to CSV
- **Search & Filter**: Advanced search, filter, and pagination for appointments
- **Toast Notifications**: Non-intrusive toast notifications for user feedback
- **Error Handling**: Comprehensive error boundary and 404 page
- **PWA Support**: Progressive Web App capabilities

## Tech Stack

### Frontend
- React 18.2.0
- React Router DOM 6.20.1
- Axios for API calls
- Socket.io-client for real-time features
- CSS3 with custom properties for theming

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io for real-time communication
- JWT for authentication
- bcryptjs for password hashing
- Razorpay for payments

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hospital_management
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

4. Start MongoDB:
   - Windows (as Administrator): `net start MongoDB`
   - Or use the provided script: `powershell -ExecutionPolicy Bypass -File .\start-mongodb.ps1`

5. Seed demo users (optional):
```bash
npm run seed
```

6. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Demo Users

After running the seed script, you can log in with these accounts (password: `111111`):

- **Admin**: `admin@demo.com`
- **Doctor 1**: `doctor1@demo.com`
- **Doctor 2**: `doctor2@demo.com`
- **Patient 1**: `patient1@demo.com`
- **Patient 2**: `patient2@demo.com`

## Project Structure

```
.
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── scripts/         # Utility scripts (seed, etc.)
│   └── server.js        # Backend entry point
├── frontend/
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.js       # Main app component
│   │   └── index.js     # Frontend entry point
│   └── package.json
└── README.md

```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile
- `POST /api/auth/change-password` - Change password

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Tests
- `GET /api/tests` - Get all tests
- `POST /api/tests/create` - Create test
- `POST /api/tests/:id/start` - Start test
- `POST /api/tests/:id/submit` - Submit test

### Prescriptions
- `GET /api/prescriptions` - Get all prescriptions
- `POST /api/prescriptions` - Create prescription

### Payments
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Socket.io Events

### Client → Server
- `join` - Join a room
- `chat:send` - Send chat message
- `emergency:alert` - Send emergency alert
- `webrtc:signal` - WebRTC signaling

### Server → Client
- `chat:message` - Receive chat message
- `emergency:alert` - Receive emergency alert
- `webrtc:signal` - WebRTC signaling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- React team for the amazing framework
- Express.js for the robust backend framework
- MongoDB for the flexible database solution
- Socket.io for real-time communication capabilities
