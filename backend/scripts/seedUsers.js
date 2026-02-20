const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management';

const DEMO_PASSWORD = '111111';

const demoUsers = [
  {
    name: 'Admin Demo',
    email: 'admin@demo.com',
    password: DEMO_PASSWORD,
    role: 'admin',
  },
  {
    name: 'Dr. Aisha Khan',
    email: 'doctor1@demo.com',
    password: DEMO_PASSWORD,
    role: 'doctor',
    specialization: 'Cardiology',
    licenseNumber: 'LIC-CARD-1001',
  },
  {
    name: 'Dr. Rohan Mehta',
    email: 'doctor2@demo.com',
    password: DEMO_PASSWORD,
    role: 'doctor',
    specialization: 'Neurology',
    licenseNumber: 'LIC-NEUR-1002',
  },
  {
    name: 'Patient One',
    email: 'patient1@demo.com',
    password: DEMO_PASSWORD,
    role: 'patient',
    age: 28,
    gender: 'female',
    phone: '9999999991',
    address: 'Demo Street 1',
  },
  {
    name: 'Patient Two',
    email: 'patient2@demo.com',
    password: DEMO_PASSWORD,
    role: 'patient',
    age: 35,
    gender: 'male',
    phone: '9999999992',
    address: 'Demo Street 2',
  },
];

async function upsertUser(userData) {
  const existing = await User.findOne({ email: userData.email });
  if (existing) {
    // Keep existing password; update profile fields to keep demo data fresh.
    existing.name = userData.name;
    existing.role = userData.role;
    if (userData.role === 'doctor') {
      existing.specialization = userData.specialization || '';
      existing.licenseNumber = userData.licenseNumber || '';
    }
    if (userData.role === 'patient') {
      existing.age = userData.age ?? null;
      existing.gender = userData.gender ?? null;
      existing.phone = userData.phone || '';
      existing.address = userData.address || '';
    }
    await existing.save();
    return { user: existing, created: false };
  }

  const user = new User(userData);
  await user.save();
  return { user, created: true };
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const results = [];
  for (const u of demoUsers) {
    // For safety, only set default password on create.
    const { password, ...rest } = u;
    const res = await upsertUser({ ...rest, password });
    results.push({ email: u.email, role: u.role, created: res.created });
  }

  console.table(results);
  console.log('Demo users ready. Password for all demo users is:', DEMO_PASSWORD);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });

