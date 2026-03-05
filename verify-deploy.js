// Quick verification of the deployed features
const { Client } = require('ssh2');

const VPS = { host: '5.189.163.4', port: 22, username: 'root', password: 'Qualis2026' };

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d.toString(); process.stdout.write(d.toString()); });
      stream.stderr.on('data', (d) => { process.stderr.write(d.toString()); });
      stream.on('close', () => resolve(out));
    });
  });
}

async function main() {
  const conn = new Client();
  return new Promise((resolve) => {
    conn.on('ready', async () => {
      console.log('Connected');
      try {
        // Test 1: Health check
        console.log('\n=== Test 1: Health ===');
        await exec(conn, 'curl -s -o /dev/null -w "HTTP %{http_code}" https://sgr.unikin.ac.cd/ 2>&1');
        
        // Test 2: Forgot password page loads
        console.log('\n\n=== Test 2: Forgot Password Page ===');
        await exec(conn, 'curl -s -o /dev/null -w "HTTP %{http_code}" https://sgr.unikin.ac.cd/forgot-password 2>&1');
        
        // Test 3: OTP API endpoint works
        console.log('\n\n=== Test 3: OTP API (bad email) ===');
        await exec(conn, `curl -s -X POST https://sgr.unikin.ac.cd/api/forgot-password -H 'Content-Type: application/json' -d '{"email":"test@test.com"}' 2>&1`);
        
        // Test 4: Activity logs API (without auth)
        console.log('\n\n=== Test 4: Activity Logs API (no auth) ===');
        await exec(conn, 'curl -s https://sgr.unikin.ac.cd/api/admin/activity-logs 2>&1');
        
        // Test 5: Activity logs page loads
        console.log('\n\n=== Test 5: Journal Page ===');
        await exec(conn, 'curl -s -o /dev/null -w "HTTP %{http_code}" https://sgr.unikin.ac.cd/admin/journal-activites 2>&1');
        
        // Test 6: Verify OTP tables
        console.log('\n\n=== Test 6: DB Tables ===');
        await exec(conn, `su - postgres -c "psql -d sgr_unikin -c 'SELECT count(*) as activity_logs FROM admin_activity_logs; SELECT count(*) as otp_codes FROM otp_codes;'"`);
        
        console.log('\n\n=== ALL TESTS DONE ===');
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
