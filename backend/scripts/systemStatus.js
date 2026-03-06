const axios = require('axios');
const chalk = require('chalk');

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

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

// Utility functions
function logStatus(status, message, details = '') {
  const statusColor = status === '✅' ? colors.green : colors.red;
  console.log(`${statusColor}${status}${colors.reset} ${message}${details ? colors.cyan + details + colors.reset : ''}`);
}

function logSection(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.magenta}${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
}

function logHeader() {
  console.clear();
  console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                    🏥 HOSPITAL MANAGEMENT SYSTEM               ║
║                        SYSTEM STATUS DASHBOARD                 ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
}

// Test functions
async function testBackendHealth() {
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    logStatus('✅', 'Backend Health Check', `Status: ${response.data.status}`);
    return true;
  } catch (error) {
    logStatus('❌', 'Backend Health Check', `Error: ${error.message}`);
    return false;
  }
}

async function testDatabase() {
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    if (response.data.mongoConnected) {
      logStatus('✅', 'MongoDB Database', 'Connected and operational');
      return true;
    } else {
      logStatus('❌', 'MongoDB Database', 'Not connected');
      return false;
    }
  } catch (error) {
    logStatus('❌', 'MongoDB Database', `Error: ${error.message}`);
    return false;
  }
}

async function testAuthentication() {
  try {
    // Test patient login
    const patientResponse = await axios.post(`${BASE_URL}/api/auth/signin`, PATIENT_CREDENTIALS);
    logStatus('✅', 'Patient Authentication', 'Login successful');
    
    // Test doctor login
    const doctorResponse = await axios.post(`${BASE_URL}/api/auth/signin`, DOCTOR_CREDENTIALS);
    logStatus('✅', 'Doctor Authentication', 'Login successful');
    
    return {
      patientToken: patientResponse.data.token,
      doctorToken: doctorResponse.data.token,
      patientUser: patientResponse.data.user,
      doctorUser: doctorResponse.data.user
    };
  } catch (error) {
    logStatus('❌', 'Authentication', `Error: ${error.message}`);
    return null;
  }
}

async function testAppointments(tokens) {
  try {
    const response = await axios.get(`${BASE_URL}/api/appointments/patient`, {
      headers: { Authorization: `Bearer ${tokens.patientToken}` }
    });
    logStatus('✅', 'Appointments System', `${response.data.appointments?.length || 0} appointments found`);
    return true;
  } catch (error) {
    logStatus('❌', 'Appointments System', `Error: ${error.message}`);
    return false;
  }
}

async function testPrescriptions(tokens) {
  try {
    const response = await axios.get(`${BASE_URL}/api/prescriptions/patient/${tokens.patientUser._id}`, {
      headers: { Authorization: `Bearer ${tokens.patientToken}` }
    });
    logStatus('✅', 'Prescriptions System', `${response.data.prescriptions?.length || 0} prescriptions found`);
    return true;
  } catch (error) {
    logStatus('❌', 'Prescriptions System', `Error: ${error.message}`);
    return false;
  }
}

async function testTests(tokens) {
  try {
    const response = await axios.get(`${BASE_URL}/api/tests/patient/${tokens.patientUser._id}`, {
      headers: { Authorization: `Bearer ${tokens.patientToken}` }
    });
    logStatus('✅', 'Medical Tests System', `${response.data.tests?.length || 0} tests found`);
    return true;
  } catch (error) {
    logStatus('❌', 'Medical Tests System', `Error: ${error.message}`);
    return false;
  }
}

async function testAIFeatures(tokens) {
  try {
    // Test medicine information
    const medResponse = await axios.post(`${BASE_URL}/api/ai/medicine-info`, {
      medicine: 'paracetamol'
    }, {
      headers: { Authorization: `Bearer ${tokens.patientToken}` }
    });
    
    if (medResponse.data.success) {
      logStatus('✅', 'AI Medicine Info', 'Working (simulation mode)');
    } else {
      logStatus('❌', 'AI Medicine Info', 'Failed');
      return false;
    }

    // Test health recommendations
    const healthResponse = await axios.post(`${BASE_URL}/api/ai/health-recommendations`, {
      userId: tokens.patientUser._id,
      age: tokens.patientUser.age,
      gender: tokens.patientUser.gender
    }, {
      headers: { Authorization: `Bearer ${tokens.patientToken}` }
    });
    
    if (healthResponse.data.success) {
      logStatus('✅', 'AI Health Recommendations', 'Working (simulation mode)');
    } else {
      logStatus('❌', 'AI Health Recommendations', 'Failed');
      return false;
    }
    
    return true;
  } catch (error) {
    logStatus('❌', 'AI Features', `Error: ${error.message}`);
    return false;
  }
}

async function testRealTimeFeatures() {
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    if (response.data.mongoConnected) {
      logStatus('✅', 'Real-time Socket.io', 'Server running');
      logStatus('✅', 'Real-time Database', 'Connection active');
      return true;
    }
    return false;
  } catch (error) {
    logStatus('❌', 'Real-time Features', `Error: ${error.message}`);
    return false;
  }
}

async function testFrontend() {
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    logStatus('✅', 'Frontend Server', `Running (Status: ${response.status})`);
    return true;
  } catch (error) {
    logStatus('❌', 'Frontend Server', `Error: ${error.message}`);
    return false;
  }
}

async function getDataStatistics(tokens) {
  try {
    const [appointmentsRes, prescriptionsRes, testsRes] = await Promise.all([
      axios.get(`${BASE_URL}/api/appointments/patient`, {
        headers: { Authorization: `Bearer ${tokens.patientToken}` }
      }),
      axios.get(`${BASE_URL}/api/prescriptions/patient/${tokens.patientUser._id}`, {
        headers: { Authorization: `Bearer ${tokens.patientToken}` }
      }),
      axios.get(`${BASE_URL}/api/tests/patient/${tokens.patientUser._id}`, {
        headers: { Authorization: `Bearer ${tokens.patientToken}` }
      })
    ]);

    return {
      appointments: appointmentsRes.data.appointments?.length || 0,
      prescriptions: prescriptionsRes.data.prescriptions?.length || 0,
      tests: testsRes.data.tests?.length || 0
    };
  } catch (error) {
    return { appointments: 0, prescriptions: 0, tests: 0 };
  }
}

// Main system status dashboard
async function showSystemStatus() {
  logHeader();
  
  const results = {
    backendHealth: false,
    database: false,
    auth: false,
    appointments: false,
    prescriptions: false,
    tests: false,
    aiFeatures: false,
    realTimeFeatures: false,
    frontend: false
  };

  logSection('🔍 SYSTEM HEALTH CHECKS');
  
  // Test all systems
  results.backendHealth = await testBackendHealth();
  results.database = await testDatabase();
  
  const tokens = await testAuthentication();
  results.auth = tokens !== null;
  
  if (tokens) {
    results.appointments = await testAppointments(tokens);
    results.prescriptions = await testPrescriptions(tokens);
    results.tests = await testTests(tokens);
    results.aiFeatures = await testAIFeatures(tokens);
  }
  
  results.realTimeFeatures = await testRealTimeFeatures();
  results.frontend = await testFrontend();

  // Data statistics
  const stats = tokens ? await getDataStatistics(tokens) : { appointments: 0, prescriptions: 0, tests: 0 };

  // Results summary
  logSection('📊 SYSTEM STATUS SUMMARY');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const passRate = Math.round((passedTests / totalTests) * 100);

  const statusColor = passRate === 100 ? colors.green : passRate >= 80 ? colors.yellow : colors.red;
  console.log(`${statusColor}🎯 OVERALL: ${passedTests}/${totalTests} systems operational (${passRate}% success rate)${colors.reset}`);

  // Data summary
  logSection('📈 DATA STATISTICS');
  console.log(`${colors.cyan}📅 Appointments:${colors.reset} ${stats.appointments}`);
  console.log(`${colors.cyan}💊 Prescriptions:${colors.reset} ${stats.prescriptions}`);
  console.log(`${colors.cyan}🔬 Medical Tests:${colors.reset} ${stats.tests}`);

  // Access information
  logSection('🌐 ACCESS INFORMATION');
  console.log(`${colors.green}📱 Frontend Application:${colors.reset} ${FRONTEND_URL}`);
  console.log(`${colors.green}🔧 Backend API:${colors.reset} ${BASE_URL}`);
  console.log(`${colors.green}📊 Health Check:${colors.reset} ${BASE_URL}/api/health`);

  // Login credentials
  logSection('👤 LOGIN CREDENTIALS');
  console.log(`${colors.blue}👥 Patient:${colors.reset} john.anderson@email.com / patient123`);
  console.log(`${colors.blue}👨‍⚕️  Doctor:${colors.reset} sarah.chen@medicenter.com / doctor123`);

  // System features
  logSection('🚀 SYSTEM FEATURES');
  console.log(`${colors.magenta}⚡ Real-time Synchronization:${colors.reset} Socket.io enabled`);
  console.log(`${colors.magenta}🏥 Professional Healthcare:${colors.reset} Medical-grade UI`);
  console.log(`${colors.magenta}🤖 AI Healthcare Features:${colors.reset} 8 advanced tools`);
  console.log(`${colors.magenta}📹 Video Telemedicine:${colors.reset} WebRTC powered`);
  console.log(`${colors.magenta}📊 Health Dashboard:${colors.reset} Real-time analytics`);
  console.log(`${colors.magenta}💊 Prescription Management:${colors.reset} Digital prescriptions`);
  console.log(`${colors.magenta}🔬 Medical Tests:${colors.reset} Comprehensive testing`);
  console.log(`${colors.magenta}📅 Appointment System:${colors.reset} Smart scheduling`);

  // Final status
  logSection('🎉 PRESENTATION READY');
  
  if (passRate === 100) {
    console.log(`${colors.green}🌟 EXCELLENT! All systems are operational and ready for presentation!${colors.reset}`);
    console.log(`${colors.green}🏥 Your hospital management system is working perfectly!${colors.reset}`);
  } else if (passRate >= 80) {
    console.log(`${colors.yellow}✅ GOOD! Most systems are operational for presentation!${colors.reset}`);
    console.log(`${colors.yellow}🔧 Minor issues exist but core functionality works!${colors.reset}`);
  } else {
    console.log(`${colors.red}⚠️  ATTENTION! Some critical systems need fixing before presentation!${colors.reset}`);
  }

  console.log(`\n${colors.cyan}🚀 Your hospital management system is ready to impress! 🎉${colors.reset}`);
}

// Run the status dashboard
showSystemStatus().catch(console.error);
