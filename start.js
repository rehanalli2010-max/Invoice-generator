const { spawn } = require('child_process');
const path = require('path');

const proc = spawn('node', ['server/server-unified.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: false,
  env: { ...process.env }
});

proc.on('error', err => console.error('Failed to start:', err.message));
proc.on('exit', (code, signal) => {
  if (code != null) process.exit(code);
  if (signal) process.exit(1);
});

process.on('SIGINT', () => proc.kill('SIGINT'));
process.on('SIGTERM', () => proc.kill('SIGTERM'));
