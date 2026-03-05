// Find app directory on VPS and deploy
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
      console.log('(timeout)');
      resolve({ stdout: '', stderr: 'timeout', code: -1 });
    }, timeout);
    conn.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); return reject(err); }
      let stdout = '', stderr = '';
      stream.on('data', (d) => { stdout += d.toString(); process.stdout.write(d.toString()); });
      stream.stderr.on('data', (d) => { stderr += d.toString(); process.stderr.write(d.toString()); });
      stream.on('close', (code) => { clearTimeout(timer); resolve({ stdout, stderr, code }); });
    });
  });
}

async function main() {
  const conn = new Client();
  return new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      console.log('=== Connected ===');
      try {
        // Find the app directory
        await exec(conn, 'pm2 describe sgr-unikin 2>&1 | grep "exec cwd" | head -5');
        await exec(conn, 'find / -name "next.config.ts" -path "*/sgr*" 2>/dev/null | head -5');
        await exec(conn, 'pm2 list 2>&1');
        // Delete the errored duplicate process
        await exec(conn, 'pm2 delete 1 2>&1 || true');
        await exec(conn, 'pm2 list 2>&1');
      } catch (err) {
        console.error('Error:', err.message);
      } finally {
        conn.end();
        resolve();
      }
    });
    conn.on('error', reject);
    conn.connect({ ...VPS, readyTimeout: 30000 });
  });
}
main().catch(console.error);
