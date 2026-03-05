// Run migration SQL directly on VPS
const { Client } = require('ssh2');

const VPS = { host: '5.189.163.4', port: 22, username: 'root', password: 'Qualis2026' };

function exec(conn, cmd, timeout = 30000) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> ${cmd}`);
    const timer = setTimeout(() => resolve(''), timeout);
    conn.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); return reject(err); }
      let out = '';
      stream.on('data', (d) => { out += d.toString(); process.stdout.write(d.toString()); });
      stream.stderr.on('data', (d) => { process.stderr.write(d.toString()); });
      stream.on('close', () => { clearTimeout(timer); resolve(out); });
    });
  });
}

async function main() {
  const conn = new Client();
  return new Promise((resolve) => {
    conn.on('ready', async () => {
      console.log('Connected');
      try {
        // Run the migration SQL directly via psql
        const sql = `
          CREATE TABLE IF NOT EXISTS admin_activity_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            action_type VARCHAR(50) NOT NULL,
            target_type VARCHAR(50),
            target_id VARCHAR(255),
            details JSONB DEFAULT '{}',
            ip_address VARCHAR(45),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_activity_logs_admin ON admin_activity_logs(admin_id);
          CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON admin_activity_logs(created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON admin_activity_logs(action_type);

          CREATE TABLE IF NOT EXISTS otp_codes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            code VARCHAR(6) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            attempts INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_otp_codes_user ON otp_codes(user_id);
        `;
        
        // Use psql to run the migration (escape for bash)
        const escapedSql = sql.replace(/'/g, "'\\''");
        await exec(conn, `su - postgres -c "psql -d sgr_unikin -c '${escapedSql}'"`, 15000);
        
        console.log('\n\nVerifying tables...');
        await exec(conn, `su - postgres -c "psql -d sgr_unikin -c '\\\\dt admin_activity_logs; \\\\dt otp_codes;'"`, 10000);
        
        console.log('\nMigration complete!');
      } catch (err) {
        console.error('Error:', err.message);
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
