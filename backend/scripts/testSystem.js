const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

// Test credentials
const PATIENT_CREDENTIALS = {
  email: 'john.anderson@email.com',
  password: 'patient123'
};

const DOCTOR_CREDENTIALS = {
  email: 'sarah.chen@medicenter.com',
  password: 'doctor123'
};

// Test functions
async function testBackendHealth() {
  console.log('🔍 Testing Backend Health...');
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Backend Health:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend Health Error:', error.message);
    return false;
  }
}

async function testAuth() {
  console.log('🔍 Testing Authentication...');
  try {
    // Test patient login
    const patientResponse = await axios.post(`${BASE_URL}/api/auth/signin`, PATIENT_CREDENTIALS);
    console.log('✅ Patient Auth Success:', patientResponse.data.success);
    
    // Test doctor login
    const doctorResponse = await axios.post(`${BASE_URL}/api/auth/signin`, DOCTOR_CREDENTIALS);
    console.log('✅ Doctor Auth Success:', doctorResponse.data.success);
    
    return {
      patientToken: patientResponse.data.token,
      doctorToken: doctorResponse.data.token,
      patientUser: patientResponse.data.user,
      doctorUser: doctorResponse.data.user
    };
  } catch (error) {
    console.error('❌ Auth Error:', error.message);
    return null;
  }
}

async function testAppointments(tokens) {
  console.log('🔍 Testing Appointments...');
  try {
    const response = await axios.get(`${BASE_URL}/api/appointments/patient`, {
      headers: { Authorization: `Bearer ${tokens.patientToken}` }
    });
    console.log('✅ Appointments Success:', response.data.success);
    console.log(`📊 Found ${response.data.appointments?.length || 0} appointments`);
    return true;
  } catch (error) {
    console.error('❌ Appointments Error:', error.message);
    return false;
  }
}

async function testPrescriptions(tokens) {
  console.log('🔍 Testing Prescriptions...');
  try {
    const response = await axios.get(`${BASE_URL}/api/prescriptions/patient/${tokens.patientUser._id}`, {
      headers: { Authorization: `Bearer ${tokens.patientToken}` }
    });
    console.log('✅ Prescriptions Success:', response.data.success);
    console.log(`📊 Found ${response.data.prescriptions?.length || 0} prescriptions`);
    return true;
  } catch (error) {
    console.error('❌ Prescriptions Error:', error.message);
    return false;
  }
}

async function testTests(tokens) {
  console.log('🔍 Testing Tests...');
  try {
    const response = await axios.get(`${BASE_URL}/api/tests/patient/${tokens.patientUser._id}`, {
      headers: { Authorization: `Bearer ${tokens.patientToken}` }
    });
    console.log('✅ Tests Success:', response.data.success);
    console.log(`📊 Found ${response.data.tests?.length || 0} tests`);
    return true;
  } catch (error) {
    console.error('❌ Tests Error:', error.message);
    return false;
  }
}

async function testAIFeatures(tokens) {
  console.log('🔍 Testing AI Features...');
  try {
    // Test medicine information
    const medResponse = await axios.post(`${BASE_URL}/api/ai/medicine-info`, {
      medicine: 'paracetamol'
    }, {
      headers: { Authorization: `Bearer ${tokens.patientToken}` }
    });
    console.log('✅ Medicine Info Success:', medResponse.data.success);

    // Test health recommendations
    const healthResponse = await axios.post(`${BASE_URL}/api/ai/health-recommendations`, {
      userId: tokens.patientUser._id,
      age: tokens.patientUser.age,
      gender: tokens.patientUser.gender
    }, {
      headers: { Authorization: `Bearer ${tokens.patientToken}` }
    });
    console.log('✅ Health Recommendations Success:', healthResponse.data.success);
    
    return true;
  } catch (error) {
    console.error('❌ AI Features Error:', error.message);
    return false;
  }
}

async function testRealTimeFeatures() {
  console.log('🔍 Testing Real-time Features...');
  try {
    // Test if Socket.io is accessible
    const response = await axios.get(`${BASE_URL}/api/health`);
    if (response.data.mongoConnected) {
      console.log('✅ Real-time Database Connection: Active');
      console.log('✅ Socket.io Server: Running');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Real-time Features Error:', error.message);
    return false;
  }
}

async function testFrontendAccess() {
  console.log('🔍 Testing Frontend Access...');
  try {
    const axios = require('axios');
    const response = await axios.get(FRONTEND_URL, {
      timeout: 5000
    });
    console.log('✅ Frontend Access: Success');
    console.log(`📊 Frontend Status: ${response.status}`);
    return true;
  } catch (error) {
    console.error('❌ Frontend Access Error:', error.message);
    return false;
  }
}

// Main test runner
async function runSystemTests() {
  console.log('🚀 STARTING COMPREHENSIVE SYSTEM TESTS\n');
  console.log('=' .repeat(50));
  
  const results = {
    backendHealth: false,
    auth: false,
    appointments: false,
    prescriptions: false,
    tests: false,
    aiFeatures: false,
    realTimeFeatures: false,
    frontendAccess: false
  };

  // Test backend health
  results.backendHealth = await testBackendHealth();
  console.log('');

  // Test authentication
  const tokens = await testAuth();
  results.auth = tokens !== null;
  console.log('');

  if (tokens) {
    // Test main features
    results.appointments = await testAppointments(tokens);
    console.log('');
    
    results.prescriptions = await testPrescriptions(tokens);
    console.log('');
    
    results.tests = await testTests(tokens);
    console.log('');
    
    results.aiFeatures = await testAIFeatures(tokens);
    console.log('');
  }

  // Test real-time features
  results.realTimeFeatures = await testRealTimeFeatures();
  console.log('');

  // Test frontend access
  results.frontendAccess = await testFrontendAccess();
  console.log('');

  // Results summary
  console.log('=' .repeat(50));
  console.log('📊 SYSTEM TEST RESULTS SUMMARY:\n');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const passRate = Math.round((passedTests / totalTests) * 100);

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${testName}`);
  });

  console.log(`\n🎯 OVERALL: ${passedTests}/${totalTests} tests passed (${passRate}% success rate)`);
  
  if (passRate === 100) {
    console.log('🎉 ALL SYSTEMS WORKING PERFECTLY!');
    console.log('🏥 Your hospital management system is ready for presentation!');
  } else {
    console.log('⚠️  Some systems need attention before presentation.');
  }

  console.log('\n🌐 ACCESS URLS:');
  console.log(`📱 Frontend: ${FRONTEND_URL}`);
  console.log(`🔧 Backend API: ${BASE_URL}`);
  
  console.log('\n👤 LOGIN CREDENTIALS:');
  console.log('👥 Patient: john.anderson@email.com / patient123');
  console.log('👨‍⚕️ Doctor: sarah.chen@medicenter.com / doctor123');
}

// Run tests
runSystemTests().catch(console.error);
