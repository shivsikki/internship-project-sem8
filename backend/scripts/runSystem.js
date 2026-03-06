#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const chalk = require('chalk');
const path = require('path');

// ANSI color codes
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

function logHeader() {
  console.clear();
  console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║              🏥 HOSPITAL MANAGEMENT SYSTEM               ║
║                  COMPLETE SYSTEM RUNNER                 ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
}

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, cwd, description) {
  return new Promise((resolve, reject) => {
    log(`\n🚀 ${description}...`, colors.blue);
    
    const child = spawn(command, { 
      shell: true, 
      cwd: cwd,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${description} completed successfully!`, colors.green);
        resolve();
      } else {
        log(`❌ ${description} failed with code ${code}`, colors.red);
        reject(new Error(`${description} failed`));
      }
    });

    child.on('error', (error) => {
      log(`❌ ${description} error: ${error.message}`, colors.red);
      reject(error);
    });
  });
}

function killProcessesOnPorts() {
  return new Promise((resolve) => {
    log('🔄 Checking for existing processes on ports 3000 and 5000...', colors.yellow);
    
    exec('netstat -ano | findstr :3000', (error, stdout) => {
      if (stdout) {
        const lines = stdout.split('\n');
        lines.forEach(line => {
          const match = line.match(/LISTENING\s+(\d+)/);
          if (match) {
            const pid = match[1];
            exec(`taskkill /PID ${pid} /F`, () => {
              log(`🔪 Killed process ${pid} on port 3000`, colors.yellow);
            });
          }
        });
      }
    });

    exec('netstat -ano | findstr :5000', (error, stdout) => {
      if (stdout) {
        const lines = stdout.split('\n');
        lines.forEach(line => {
          const match = line.match(/LISTENING\s+(\d+)/);
          if (match) {
            const pid = match[1];
            exec(`taskkill /PID ${pid} /F`, () => {
              log(`🔪 Killed process ${pid} on port 5000`, colors.yellow);
            });
          }
        });
      }
      setTimeout(resolve, 2000); // Wait for processes to be killed
    });
  });
}

async function startBackend() {
  const backendPath = path.join(__dirname, '..');
  
  return new Promise((resolve, reject) => {
    log('\n🖥️ Starting Backend Server...', colors.blue);
    
    const backend = spawn('npm', ['start'], {
      cwd: backendPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let backendStarted = false;

    backend.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('Server + Socket.io running on port 5000')) {
        if (!backendStarted) {
          backendStarted = true;
          log('✅ Backend Server started successfully!', colors.green);
          resolve(backend);
        }
      }
    });

    backend.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(output);
    });

    backend.on('error', (error) => {
      log(`❌ Backend error: ${error.message}`, colors.red);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!backendStarted) {
        log('⚠️ Backend startup timeout, but continuing...', colors.yellow);
        resolve(backend);
      }
    }, 30000);
  });
}

async function startFrontend() {
  const frontendPath = path.join(__dirname, '..', '..', 'frontend');
  
  return new Promise((resolve, reject) => {
    log('\n🌐 Starting Frontend Server...', colors.blue);
    
    const frontend = spawn('npm', ['start'], {
      cwd: frontendPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let frontendStarted = false;

    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('Compiled successfully') || output.includes('You can now view')) {
        if (!frontendStarted) {
          frontendStarted = true;
          log('✅ Frontend Server started successfully!', colors.green);
          resolve(frontend);
        }
      }
    });

    frontend.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(output);
    });

    frontend.on('error', (error) => {
      log(`❌ Frontend error: ${error.message}`, colors.red);
      reject(error);
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (!frontendStarted) {
        log('⚠️ Frontend startup timeout, but continuing...', colors.yellow);
        resolve(frontend);
      }
    }, 60000);
  });
}

async function seedData() {
  try {
    log('\n🌱 Seeding realistic data...', colors.blue);
    await runCommand('node scripts/seedRealisticData.js', path.join(__dirname, '..'), 'Seeding Users and Appointments');
    await runCommand('node scripts/createDemoTests.js', path.join(__dirname, '..'), 'Creating Demo Tests');
    log('✅ Data seeding completed!', colors.green);
  } catch (error) {
    log('⚠️ Data seeding failed, but continuing...', colors.yellow);
  }
}

async function showSystemStatus() {
  try {
    log('\n📊 Running system status check...', colors.blue);
    await runCommand('node scripts/systemStatus.js', path.join(__dirname, '..'), 'System Status Check');
  } catch (error) {
    log('⚠️ System status check failed, but servers are running...', colors.yellow);
  }
}

function showFinalInfo() {
  console.log(`\n${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                    🎉 SYSTEM READY! 🎉                      ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  log('\n🌱 ACCESS YOUR HOSPITAL SYSTEM:', colors.magenta);
  log(`📱 Frontend Application: ${colors.green}http://localhost:3000${colors.reset}`);
  log(`🔧 Backend API: ${colors.green}http://localhost:5000${colors.reset}`);
  log(`📊 Health Check: ${colors.green}http://localhost:5000/api/health${colors.reset}`);

  log('\n👤 LOGIN CREDENTIALS:', colors.magenta);
  log(`👥 Patient: ${colors.blue}john.anderson@email.com${colors.reset} / ${colors.blue}patient123${colors.reset}`);
  log(`👨‍⚕️  Doctor: ${colors.blue}sarah.chen@medicenter.com${colors.reset} / ${colors.blue}doctor123${colors.reset}`);

  log('\n🚀 SYSTEM FEATURES:', colors.magenta);
  log('⚡ Real-time Synchronization: Socket.io enabled');
  log('🏥 Professional Healthcare: Medical-grade UI');
  log('🤖 AI Healthcare Features: 8 advanced tools');
  log('📹 Video Telemedicine: WebRTC powered');
  log('📊 Health Dashboard: Real-time analytics');
  log('💊 Prescription Management: Digital prescriptions');
  log('🔬 Medical Tests: Comprehensive testing');
  log('📅 Appointment System: Smart scheduling');

  log('\n🎯 PERFECT FOR YOUR PRESENTATION:', colors.green);
  log('✨ Real-time medical data synchronization');
  log('✨ Professional healthcare technology demonstration');
  log('✨ AI-powered health management system');
  log('✨ Modern web application architecture');
  log('✨ Video telemedicine capabilities');

  log('\n🔥 TEST THE REAL-TIME FEATURES:', colors.yellow);
  log('1. Open 2 browser tabs with the same login');
  log('2. Create a test/prescription in Tab 1');
  log('3. Watch Tab 2 update instantly!');

  log(`\n${colors.green}🏥 Your hospital management system is ready to impress! 🎉${colors.reset}`);
}

// Main execution
async function main() {
  logHeader();
  
  try {
    // Step 1: Kill existing processes
    await killProcessesOnPorts();
    
    // Step 2: Start backend
    const backend = await startBackend();
    
    // Step 3: Start frontend
    const frontend = await startFrontend();
    
    // Step 4: Seed data
    await seedData();
    
    // Step 5: Show system status
    await showSystemStatus();
    
    // Step 6: Show final information
    showFinalInfo();

    // Keep servers running
    log('\n🔄 Servers are running... Press Ctrl+C to stop', colors.cyan);
    
    process.on('SIGINT', () => {
      log('\n🛑 Shutting down servers...', colors.yellow);
      backend.kill();
      frontend.kill();
      process.exit(0);
    });

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the system
main();
