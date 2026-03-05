// Run migrations on VPS
const { Client } = require('ssh2');

const VPS = { host: '5.189.163.4', port: 22, username: 'root', password: 'Qualis2026' };

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`>>> ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      stream.on('data', (d) => { stdout += d.toString(); process.stdout.write(d.toString()); });
      stream.stderr.on('data', (d) => { process.stderr.write(d.toString()); });
      stream.on('close', () => resolve(stdout));
    });
  });
}

async function main() {
  const conn = new Client();
  return new Promise((resolve) => {
    conn.on('ready', async () => {
      try {
        // Get the secret from .env
        const envResult = await exec(conn, 'grep NEXTAUTH_SECRET /var/www/sgr-unikin/.env');
        const secret = envResult.trim().split('=')[1];
        console.log(`\nSecret found, running migration...\n`);
        
        // Run migration via curl with the secret
        const encSecret = encodeURIComponent(secret);
        await exec(conn, `curl -s "http://localhost:3000/api/migrate?secret=${encSecret}" 2>&1`);
        
        console.log('\n\nDone!');
      } catch (err) {
        console.error(err);
      } finally {
        conn.end();
        resolve();
      }
    });
    conn.on('error', console.error);
    conn.connect({ ...VPS, readyTimeout: 30000 });
  });
}
main();
