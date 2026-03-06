const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management';

// Realistic doctor data
const realDoctors = [
  {
    name: 'Dr. Sarah Chen MD',
    email: 'sarah.chen@medicenter.com',
    password: 'doctor123',
    role: 'doctor',
    specialization: 'Cardiology',
    licenseNumber: 'MD-CARD-2021-0847',
    experience: 12,
    education: 'Harvard Medical School',
    bio: 'Board-certified cardiologist with expertise in interventional cardiology and preventive heart care.',
    avatar: '/images/doctors/doctor1.jpg',
    rating: 4.9,
    patients: 1247,
    languages: ['English', 'Mandarin', 'Spanish']
  },
  {
    name: 'Dr. Michael Roberts MD',
    email: 'michael.roberts@medicenter.com',
    password: 'doctor123',
    role: 'doctor',
    specialization: 'Neurology',
    licenseNumber: 'MD-NEUR-2019-0523',
    experience: 8,
    education: 'Johns Hopkins University School of Medicine',
    bio: 'Specialist in movement disorders and neurodegenerative diseases with research focus on Parkinson\'s disease.',
    avatar: '/images/doctors/doctor2.jpg',
    rating: 4.8,
    patients: 892,
    languages: ['English', 'French']
  },
  {
    name: 'Dr. Emily Johnson DO',
    email: 'emily.johnson@medicenter.com',
    password: 'doctor123',
    role: 'doctor',
    specialization: 'Family Medicine',
    licenseNumber: 'DO-FAM-2020-0789',
    experience: 6,
    education: 'Touro College of Osteopathic Medicine',
    bio: 'Comprehensive family physician providing holistic care for all ages with emphasis on preventive medicine.',
    avatar: '/images/doctors/doctor3.jpg',
    rating: 4.7,
    patients: 1567,
    languages: ['English', 'German']
  },
  {
    name: 'Dr. James Wilson MD',
    email: 'james.wilson@medicenter.com',
    password: 'doctor123',
    role: 'doctor',
    specialization: 'Orthopedics',
    licenseNumber: 'MD-ORTHO-2018-0345',
    experience: 15,
    education: 'Stanford University School of Medicine',
    bio: 'Orthopedic surgeon specializing in sports medicine and joint replacement surgery.',
    avatar: '/images/doctors/doctor4.jpg',
    rating: 4.9,
    patients: 2103,
    languages: ['English', 'Italian']
  }
];

// Realistic patient data
const realPatients = [
  {
    name: 'John Anderson',
    email: 'john.anderson@email.com',
    password: 'patient123',
    role: 'patient',
    age: 45,
    gender: 'male',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, Boston, MA 02108',
    bloodType: 'O+',
    allergies: ['Penicillin'],
    conditions: ['Hypertension', 'Type 2 Diabetes'],
    avatar: '/images/patients/patient1.jpg'
  },
  {
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    password: 'patient123',
    role: 'patient',
    age: 32,
    gender: 'female',
    phone: '+1 (555) 234-5678',
    address: '456 Oak Avenue, Boston, MA 02115',
    bloodType: 'A+',
    allergies: ['Pollen'],
    conditions: ['Asthma'],
    avatar: '/images/patients/patient2.jpg'
  },
  {
    name: 'Robert Chen',
    email: 'robert.chen@email.com',
    password: 'patient123',
    role: 'patient',
    age: 67,
    gender: 'male',
    phone: '+1 (555) 345-6789',
    address: '789 Pine Road, Boston, MA 02116',
    bloodType: 'B+',
    allergies: [],
    conditions: ['Arthritis', 'High Cholesterol'],
    avatar: '/images/patients/patient3.jpg'
  }
];

// Realistic appointment data
const appointmentTypes = [
  'Annual Physical Exam',
  'Cardiology Consultation',
  'Neurological Evaluation',
  'Orthopedic Assessment',
  'Follow-up Visit',
  'Pre-operative Assessment',
  'Post-operative Check',
  'Vaccination',
  'Lab Results Review',
  'Medication Management'
];

// Realistic prescription data
const medications = [
  { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: '30 days' },
  { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '30 days' },
  { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', duration: '30 days' },
  { name: 'Albuterol', dosage: '90mcg', frequency: 'As needed', duration: '30 days' },
  { name: 'Ibuprofen', dosage: '400mg', frequency: 'Every 6 hours as needed', duration: '15 days' },
  { name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '7 days' }
];

async function seedRealisticData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await Prescription.deleteMany({});

    // Create doctors
    const createdDoctors = [];
    for (const doctorData of realDoctors) {
      const doctor = new User(doctorData);
      const savedDoctor = await doctor.save();
      createdDoctors.push(savedDoctor);
      console.log(`Created doctor: ${savedDoctor.name}`);
    }

    // Create patients
    const createdPatients = [];
    for (const patientData of realPatients) {
      const patient = new User(patientData);
      const savedPatient = await patient.save();
      createdPatients.push(savedPatient);
      console.log(`Created patient: ${savedPatient.name}`);
    }

    // Create realistic appointments
    const appointments = [];
    for (let i = 0; i < 50; i++) {
      const patient = createdPatients[Math.floor(Math.random() * createdPatients.length)];
      const doctor = createdDoctors[Math.floor(Math.random() * createdDoctors.length)];
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 60) - 30);
      
      const appointment = new Appointment({
        patient: patient._id,
        doctor: doctor._id,
        appointmentDate: appointmentDate,
        appointmentTime: `${Math.floor(Math.random() * 8) + 9}:${Math.random() > 0.5 ? '00' : '30'}`,
        reason: appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
        status: Math.random() > 0.3 ? 'completed' : 'confirmed',
        notes: `Patient presents with ${appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)].toLowerCase()}. Assessment and treatment plan discussed.`,
        fee: Math.floor(Math.random() * 200) + 100
      });
      
      const savedAppointment = await appointment.save();
      appointments.push(savedAppointment);
    }

    // Create realistic prescriptions
    for (let i = 0; i < 30; i++) {
      const patient = createdPatients[Math.floor(Math.random() * createdPatients.length)];
      const doctor = createdDoctors[Math.floor(Math.random() * createdDoctors.length)];
      const prescribedDate = new Date();
      prescribedDate.setDate(prescribedDate.getDate() - Math.floor(Math.random() * 30));
      
      const medicationCount = Math.floor(Math.random() * 3) + 1;
      const selectedMeds = [];
      for (let j = 0; j < medicationCount; j++) {
        const med = medications[Math.floor(Math.random() * medications.length)];
        selectedMeds.push({...med});
      }
      
      const prescription = new Prescription({
        patient: patient._id,
        doctor: doctor._id,
        prescribedDate: prescribedDate,
        medications: selectedMeds,
        diagnosis: ['Hypertension', 'Type 2 Diabetes', 'Asthma', 'Arthritis', 'High Cholesterol', 'Upper Respiratory Infection'][Math.floor(Math.random() * 6)],
        instructions: 'Take as prescribed. Follow up with doctor if any side effects occur.',
        status: Math.random() > 0.2 ? 'active' : 'completed'
      });
      
      await prescription.save();
    }

    console.log('\n🎉 Realistic data seeded successfully!');
    console.log(`Created ${createdDoctors.length} doctors`);
    console.log(`Created ${createdPatients.length} patients`);
    console.log(`Created ${appointments.length} appointments`);
    console.log(`Created 30 prescriptions`);
    
    console.log('\n📋 Login Credentials:');
    console.log('Doctors:');
    realDoctors.forEach(doc => {
      console.log(`  ${doc.email} / doctor123`);
    });
    console.log('Patients:');
    realPatients.forEach(pat => {
      console.log(`  ${pat.email} / patient123`);
    });

  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seedRealisticData();
