const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyStudents() {
  try {
    const result = await pool.query(
      "UPDATE users SET email_verified = true WHERE role = 'STUDENT'"
    );
    console.log('Étudiants vérifiés:', result.rowCount);
  } catch (e) {
    console.error('Erreur:', e.message);
  } finally {
    pool.end();
  }
}

verifyStudents();
