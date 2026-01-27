const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const result = await pool.query(
      "SELECT password FROM users WHERE email = 'admin@unikin.ac.cd'"
    );
    
    if (result.rows.length === 0) {
      console.log('Utilisateur non trouvé');
      return;
    }
    
    const hash = result.rows[0].password;
    console.log('Hash stocké:', hash);
    
    const match = await bcrypt.compare('admin123', hash);
    console.log('Mot de passe "admin123" valide:', match);
    
    // Générer un nouveau hash correct
    const newHash = await bcrypt.hash('admin123', 10);
    console.log('Nouveau hash:', newHash);
    
  } catch (e) {
    console.error('Erreur:', e.message);
  } finally {
    pool.end();
  }
}

check();
