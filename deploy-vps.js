const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const VPS_HOST = '5.189.163.4';
const VPS_USER = 'root';
const VPS_PASS = 'Qualis2026';

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> ${cmd.substring(0, 100)}...`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '', stderr = '';
      stream.on('data', (data) => { 
        const str = data.toString();
        stdout += str;
        process.stdout.write(str);
      });
      stream.stderr.on('data', (data) => {
        const str = data.toString();
        stderr += str;
        process.stderr.write(str);
      });
      stream.on('close', (code) => {
        resolve({ stdout, stderr, code });
      });
    });
  });
}

function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const readStream = fs.createReadStream(localPath);
      const writeStream = sftp.createWriteStream(remotePath);
      writeStream.on('close', () => {
        console.log(`Uploaded: ${localPath} -> ${remotePath}`);
        resolve();
      });
      writeStream.on('error', reject);
      readStream.pipe(writeStream);
    });
  });
}

async function main() {
  const conn = new Client();

  conn.on('ready', async () => {
    console.log('=== Connected to VPS ===\n');

    try {
      // Upload setup script
      console.log('[0] Uploading setup script...');
      await uploadFile(conn, path.join(__dirname, 'scripts', 'setup-vps.sh'), '/root/setup-vps.sh');

      // Make executable
      await exec(conn, 'chmod +x /root/setup-vps.sh');

      // Run the setup script  
      console.log('\n[1] Running setup script (this will take a few minutes)...');
      const result = await exec(conn, 'bash /root/setup-vps.sh 2>&1');
      
      if (result.code !== 0) {
        console.error('\n!!! Setup script failed with code:', result.code);
      }

      // Verify
      console.log('\n[2] Verifying services...');
      await exec(conn, 'systemctl status postgresql --no-pager -l 2>&1 | head -20');
      await exec(conn, 'pm2 list 2>&1');
      await exec(conn, 'systemctl status nginx --no-pager -l 2>&1 | head -20');
      await exec(conn, 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>&1 || echo "App not responding yet"');

      console.log('\n=== DEPLOYMENT COMPLETE ===');
    } catch (err) {
      console.error('Error:', err.message);
    } finally {
      conn.end();
    }
  });

  conn.on('error', (err) => {
    console.error('SSH Connection error:', err.message);
  });

  conn.connect({
    host: VPS_HOST,
    port: 22,
    username: VPS_USER,
    password: VPS_PASS,
    readyTimeout: 30000,
  });
}

main();
