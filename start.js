const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting Lang Reader application...');

// Function to check if a directory exists
function directoryExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

// Paths to our projects
const backendPath = path.join(__dirname, 'backend');
const frontendPath = path.join(__dirname, 'lang-reader');

// Check if node_modules are installed in backend
if (!directoryExists(path.join(backendPath, 'node_modules'))) {
  console.log('Installing backend dependencies...');
  const npmInstallBackend = spawn('npm', ['install'], { cwd: backendPath, stdio: 'inherit', shell: true });
  
  npmInstallBackend.on('close', (code) => {
    if (code !== 0) {
      console.error('Failed to install backend dependencies');
      process.exit(1);
    }
    startBackend();
  });
} else {
  startBackend();
}

// Function to start the backend
function startBackend() {
  console.log('Starting backend server...');
  const backend = spawn('npm', ['run', 'dev'], { cwd: backendPath, stdio: 'inherit', shell: true });
  
  backend.on('error', (err) => {
    console.error('Failed to start backend:', err);
    process.exit(1);
  });
  
  // Check if node_modules are installed in frontend
  if (!directoryExists(path.join(frontendPath, 'node_modules'))) {
    console.log('Installing frontend dependencies...');
    const npmInstallFrontend = spawn('npm', ['install'], { cwd: frontendPath, stdio: 'inherit', shell: true });
    
    npmInstallFrontend.on('close', (code) => {
      if (code !== 0) {
        console.error('Failed to install frontend dependencies');
        process.exit(1);
      }
      startFrontend();
    });
  } else {
    startFrontend();
  }
}

// Function to start the frontend
function startFrontend() {
  console.log('Starting frontend development server...');
  const frontend = spawn('npm', ['run', 'dev'], { cwd: frontendPath, stdio: 'inherit', shell: true });
  
  frontend.on('error', (err) => {
    console.error('Failed to start frontend:', err);
    process.exit(1);
  });
  
  console.log('\nApplication is starting up:');
  console.log('- Backend: http://localhost:3000');
  console.log('- Frontend: http://localhost:5173');
  console.log('\nPress Ctrl+C to stop both servers\n');
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  process.exit(0);
}); 