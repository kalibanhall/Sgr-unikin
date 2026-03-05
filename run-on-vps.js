// Quick script to run commands on VPS via SSH
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const VPS = {
  host: '5.189.163.4',
  port: 22,
  username: 'root',
  password: 'Qualis2026'
};

async function main() {
  const conn = new Client();
  const action = process.argv[2] || 'init-db';
  
  return new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      console.log('=== Connected ===');
      
      try {
        if (action === 'init-db') {
          // Upload init-db.sql
          console.log('Uploading init-db.sql...');
          await uploadFile(conn, 
            path.join(__dirname, 'scripts', 'init-db.sql'), 
            '/tmp/init-db.sql'
          );
          
          // Run init-db.sql as postgres user
          console.log('Running init-db.sql...');
          const result = await runCommand(conn, 
            'sudo -u postgres psql -d sgr_unikin -f /tmp/init-db.sql 2>&1'
          );
          console.log(result);
          
          // Now run migrations
          console.log('\nTriggering migrations...');
          const migResult = await runCommand(conn,
            'curl -s "http://localhost:3000/api/migrate?secret=MVUvJ%2BCWYEzSVbkbMyUFi9sSNUV%2BWuF4kWIiX6lzTCI%3D" 2>&1'
          );
          console.log('Migration result:', migResult);
          
          // Now update garaphmutwal password and promote to SUPER_ADMIN
          console.log('\nUpdating admin accounts...');
          const adminResult = await runCommand(conn, `sudo -u postgres psql -d sgr_unikin -c "
            UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'garaphmutwal@yahoo.fr';
            UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'sg.recherche@unikin.ac.cd';
            UPDATE users SET password = '\\$2b\\$10\\$25/iCZhv2O.Q3HAzZaP14u12y/s2gu5K18LY.8Ny/MvKdNwWz7F8a' WHERE email = 'garaphmutwal@yahoo.fr';
          " 2>&1`);
          console.log(adminResult);
          
        } else if (action === 'cmd') {
          const cmd = process.argv.slice(3).join(' ');
          console.log(`Running: ${cmd}`);
          const result = await runCommand(conn, cmd);
          console.log(result);
          
        } else if (action === 'fix-owner') {
          // Fix table ownership - tables were created by postgres but app uses sgr_user
          const fixResult = await runCommand(conn, `sudo -u postgres psql -d sgr_unikin -c "
            ALTER TABLE users OWNER TO sgr_user;
            ALTER TABLE students OWNER TO sgr_user;
            ALTER TABLE documents OWNER TO sgr_user;
            ALTER TABLE validations OWNER TO sgr_user;
            ALTER TABLE appointments OWNER TO sgr_user;
            ALTER TABLE faculties OWNER TO sgr_user;
            ALTER TABLE departments OWNER TO sgr_user;
            ALTER TABLE admin_reviews OWNER TO sgr_user;
            ALTER TYPE user_role OWNER TO sgr_user;
            ALTER TYPE validation_status OWNER TO sgr_user;
            ALTER TYPE study_level OWNER TO sgr_user;
            ALTER TYPE dossier_status OWNER TO sgr_user;
            ALTER TYPE appointment_status OWNER TO sgr_user;
            ALTER SEQUENCE IF EXISTS users_id_seq OWNER TO sgr_user;
            ALTER SEQUENCE IF EXISTS students_id_seq OWNER TO sgr_user;
            GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sgr_user;
            GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sgr_user;
            GRANT USAGE ON SCHEMA public TO sgr_user;
          " 2>&1`);
          console.log('Fix ownership:', fixResult);
          
          // Now trigger migrations via the API
          console.log('\nTriggering migrations...');
          const migResult = await runCommand(conn,
            'curl -s "http://localhost:3000/api/migrate?secret=MVUvJ%2BCWYEzSVbkbMyUFi9sSNUV%2BWuF4kWIiX6lzTCI%3D" 2>&1'
          );
          console.log('Migration result:', migResult);
          
          // Verify columns after migration
          const cols = await runCommand(conn, 
            `sudo -u postgres psql -d sgr_unikin -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;" 2>&1`
          );
          console.log('\nUsers columns after migration:', cols.trim());
          
        } else if (action === 'check-db') {
          // Check DB columns for users table
          const cols = await runCommand(conn, 
            `sudo -u postgres psql -d sgr_unikin -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;" 2>&1`
          );
          console.log('Users columns:', cols.trim());
          
          // Check tables
          const tables = await runCommand(conn,
            `sudo -u postgres psql -d sgr_unikin -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>&1`
          );
          console.log('\nTables:', tables.trim());
          
          // Check user count
          const users = await runCommand(conn,
            `sudo -u postgres psql -d sgr_unikin -t -c "SELECT email, role, admin_level FROM users WHERE role != 'STUDENT' ORDER BY role, admin_level DESC;" 2>&1`
          );
          console.log('\nAdmin users:', users.trim());
          
        } else if (action === 'logs') {
          const result = await runCommand(conn, 'pm2 logs sgr-unikin --lines 50 --nostream 2>&1');
          console.log(result);
          
        } else if (action === 'restart') {
          const result = await runCommand(conn, 'cd /var/www/sgr-unikin && git pull && npm ci && npm run build && pm2 restart sgr-unikin 2>&1');
          console.log(result);
          
        } else if (action === 'status') {
          const result = await runCommand(conn, 'pm2 list 2>&1 && echo "---" && systemctl status postgresql --no-pager -l 2>&1 | head -5 && echo "---" && systemctl status nginx --no-pager -l 2>&1 | head -5 && echo "---" && curl -s http://localhost:3000/api/health 2>&1');
          console.log(result);
        }
        
        conn.end();
        resolve();
      } catch (err) {
        console.error('Error:', err);
        conn.end();
        reject(err);
      }
    });
    
    conn.on('error', (err) => {
      console.error('Connection error:', err.message);
      reject(err);
    });
    
    conn.connect(VPS);
  });
}

function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const readStream = fs.createReadStream(localPath);
      const writeStream = sftp.createWriteStream(remotePath);
      writeStream.on('close', () => resolve());
      writeStream.on('error', (err) => reject(err));
      readStream.pipe(writeStream);
    });
  });
}

function runCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let output = '';
      stream.on('data', (data) => { output += data.toString(); });
      stream.stderr.on('data', (data) => { output += data.toString(); });
      stream.on('close', () => resolve(output));
    });
  });
}

main().catch(console.error);
