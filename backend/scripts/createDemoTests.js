const mongoose = require('mongoose');
const Test = require('../models/Test');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createDemoTests = async () => {
  try {
    console.log('Creating demo tests...');

    // Get patients and doctors
    const patients = await User.find({ role: 'patient' });
    const doctors = await User.find({ role: 'doctor' });

    if (patients.length === 0 || doctors.length === 0) {
      console.log('No patients or doctors found. Please seed users first.');
      return;
    }

    const demoTests = [
      {
        patient: patients[0]._id, // John Anderson
        doctor: doctors[0]._id,   // Dr. Sarah Chen
        testType: 'blood_test',
        testName: 'Complete Blood Count (CBC)',
        testDate: new Date(),
        bodyCheck: {
          temperature: '98.6',
          bloodPressure: '120/80',
          heartRate: '72',
          weight: '70',
          height: '170'
        },
        status: 'completed',
        testResults: 'WBC: 7.2, RBC: 4.8, Hemoglobin: 14.5, Platelets: 250,000. All values within normal range.',
        score: 95,
        maxScore: 100,
        notes: 'Patient shows normal blood parameters. No immediate concerns.'
      },
      {
        patient: patients[0]._id,
        doctor: doctors[1]._id,   // Dr. Michael Roberts
        testType: 'diabetes_test',
        testName: 'HbA1c Test',
        testDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        bodyCheck: {
          temperature: '98.4',
          bloodPressure: '125/82',
          heartRate: '75',
          weight: '71',
          height: '170'
        },
        status: 'completed',
        testResults: 'HbA1c: 6.8%. Slightly elevated, indicating prediabetes. Recommend dietary changes and increased physical activity.',
        score: 85,
        maxScore: 100,
        notes: 'Patient should follow up in 3 months for retesting.'
      },
      {
        patient: patients[1]._id, // Maria Garcia
        doctor: doctors[2]._id,   // Dr. Emily Johnson
        testType: 'x_ray',
        testName: 'Chest X-Ray',
        testDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        bodyCheck: {
          temperature: '98.2',
          bloodPressure: '118/76',
          heartRate: '68',
          weight: '65',
          height: '165'
        },
        status: 'completed',
        testResults: 'Clear lung fields. No evidence of pneumonia, pleural effusion, or pneumothorax. Cardiac silhouette normal.',
        score: 100,
        maxScore: 100,
        notes: 'Normal chest X-ray findings.'
      },
      {
        patient: patients[2]._id, // Robert Chen
        doctor: doctors[3]._id,   // Dr. James Wilson
        testType: 'cholesterol_test',
        testName: 'Lipid Panel',
        testDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        bodyCheck: {
          temperature: '98.8',
          bloodPressure: '128/84',
          heartRate: '70',
          weight: '85',
          height: '175'
        },
        status: 'completed',
        testResults: 'Total Cholesterol: 210, HDL: 45, LDL: 135, Triglycerides: 180. LDL slightly elevated.',
        score: 80,
        maxScore: 100,
        notes: 'Recommend lifestyle modifications and consider statin therapy.'
      },
      {
        patient: patients[0]._id,
        doctor: doctors[0]._id,
        testType: 'ecg',
        testName: 'Electrocardiogram',
        testDate: new Date(),
        bodyCheck: {
          temperature: '98.6',
          bloodPressure: '122/80',
          heartRate: '70',
          weight: '70',
          height: '170'
        },
        status: 'in_progress',
        timerDuration: 15,
        maxScore: 100,
        notes: 'ECG scheduled for routine cardiac evaluation.'
      }
    ];

    // Clear existing tests
    await Test.deleteMany({});

    // Create demo tests
    const createdTests = await Test.insertMany(demoTests);
    
    console.log(`✅ Created ${createdTests.length} demo tests`);
    
    // Display test summary
    createdTests.forEach((test, index) => {
      console.log(`\n${index + 1}. ${test.testName}`);
      console.log(`   Type: ${test.testType}`);
      console.log(`   Patient: ${test.patient}`);
      console.log(`   Status: ${test.status}`);
      console.log(`   Score: ${test.score || 'N/A'}/${test.maxScore || 'N/A'}`);
    });

    console.log('\n🎉 Demo tests created successfully!');
    
  } catch (error) {
    console.error('Error creating demo tests:', error);
  } finally {
    mongoose.connection.close();
  }
};

createDemoTests();
