// Quick deploy: SSH to VPS, git pull, build, migrate, restart
const { Client } = require('ssh2');

const VPS = {
  host: '5.189.163.4',
  port: 22,
  username: 'root',
  password: 'Qualis2026'
};

function exec(conn, cmd, timeout = 120000) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> ${cmd}`);
    const timer = setTimeout(() => {
      console.log('(timeout reached, continuing...)');
      resolve({ stdout: '', stderr: 'timeout', code: -1 });
    }, timeout);
    
    conn.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); return reject(err); }
      let stdout = '', stderr = '';
      stream.on('data', (data) => {
        const s = data.toString();
        stdout += s;
        process.stdout.write(s);
      });
      stream.stderr.on('data', (data) => {
        const s = data.toString();
        stderr += s;
        process.stderr.write(s);
      });
      stream.on('close', (code) => {
        clearTimeout(timer);
        resolve({ stdout, stderr, code });
      });
    });
  });
}

async function main() {
  const conn = new Client();
  
  return new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      console.log('=== Connected to VPS ===');
      try {
        const APP_DIR = '/var/www/sgr-unikin';
        
        // 1. Git pull
        console.log('\n[1/4] Pulling latest code...');
        await exec(conn, `cd ${APP_DIR} && git pull origin main 2>&1`);
        
        // 2. Install dependencies  
        console.log('\n[2/4] Installing dependencies...');
        await exec(conn, `cd ${APP_DIR} && npm install --production=false 2>&1`, 180000);
        
        // 3. Build
        console.log('\n[3/4] Building application...');
        await exec(conn, `cd ${APP_DIR} && npx next build 2>&1`, 300000);
        
        // 4. Restart PM2 & trigger migrations via /api/migrate
        console.log('\n[4/4] Restarting application...');
        await exec(conn, `cd ${APP_DIR} && pm2 restart sgr-unikin 2>&1 || pm2 start npm --name sgr-unikin -- start 2>&1`);
        
        // Wait for app to start
        await new Promise(r => setTimeout(r, 5000));
        
        // Trigger migrations
        console.log('\n[+] Running migrations...');
        await exec(conn, `curl -s http://localhost:3000/api/migrate 2>&1 | head -20`);
        
        // Health check
        console.log('\n[+] Health check...');
        await exec(conn, `curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000/ 2>&1`);
        await exec(conn, `pm2 status 2>&1`);
        
        console.log('\n=== DEPLOY COMPLETE ===');
      } catch (err) {
        console.error('Deploy error:', err.message);
      } finally {
        conn.end();
        resolve();
      }
    });
    
    conn.on('error', (err) => {
      console.error('SSH error:', err.message);
      reject(err);
    });
    
    conn.connect({ ...VPS, readyTimeout: 30000 });
  });
}

main().catch(console.error);
