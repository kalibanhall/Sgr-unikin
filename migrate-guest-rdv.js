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
        // Run migration: make student_id nullable and add guest columns
        console.log('\n=== Running guest appointment migration ===');
        await exec(conn, `su - postgres -c "psql -d sgr_unikin -c 'ALTER TABLE appointments ALTER COLUMN student_id DROP NOT NULL;'"`);
        await exec(conn, `su - postgres -c "psql -d sgr_unikin -c 'ALTER TABLE appointments ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255), ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255), ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(50);'"`);
        
        // Verify
        console.log('\n\n=== Verifying columns ===');
        await exec(conn, `su - postgres -c "psql -d sgr_unikin -c \\"SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name='appointments' ORDER BY ordinal_position;\\""`);
        
        // Test the public endpoint
        console.log('\n\n=== Testing public RDV page ===');
        await exec(conn, 'curl -s -o /dev/null -w "HTTP %{http_code}" https://sgr.unikin.ac.cd/rendez-vous 2>&1');
        
        // Test the API
        console.log('\n\n=== Testing public RDV API ===');
        await exec(conn, `curl -s -X POST https://sgr.unikin.ac.cd/api/appointments -H 'Content-Type: application/json' -d '{"guestName":"Test Visiteur","guestEmail":"test@example.com","targetRole":"SGR","subject":"Test RDV","requestedDate":"2026-04-01T10:00"}' 2>&1`);

        console.log('\n\n=== DONE ===');
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
