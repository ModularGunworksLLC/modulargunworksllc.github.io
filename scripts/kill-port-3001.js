/**
 * Kill any process using port 3001 (Windows).
 * Run: node scripts/kill-port-3001.js
 */
const { execSync } = require('child_process');
const isWin = process.platform === 'win32';

try {
  if (isWin) {
    let out = '';
    try {
      out = execSync('netstat -ano | findstr :3001', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (_) {
      // findstr exits 1 when no match - port is free
      console.log('Port 3001 is free.');
      process.exit(0);
    }
    const lines = out.split('\n').filter((l) => l.includes('LISTENING'));
    const pids = new Set();
    for (const line of lines) {
      const m = line.trim().split(/\s+/);
      const pid = m[m.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    if (pids.size === 0) {
      console.log('Port 3001 is free.');
    } else {
      for (const pid of pids) {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
        console.log('Killed PID', pid);
      }
    }
  } else {
    execSync('lsof -ti:3001 | xargs kill -9 2>/dev/null || true', { stdio: 'inherit' });
  }
} catch (e) {
  if (e.status !== 0 && e.status !== 1) process.exit(1);
}
