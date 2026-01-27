const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixPasswords() {
  try {
    // Générer les bons hash
    const superadminHash = await bcrypt.hash('superadmin123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);
    
    console.log('Nouveau hash superadmin:', superadminHash);
    console.log('Nouveau hash admin:', adminHash);
    
    // Mettre à jour les mots de passe
    await pool.query(
      "UPDATE users SET password = $1 WHERE email = 'sg.recherche@unikin.ac.cd'",
      [superadminHash]
    );
    console.log('✅ Mot de passe Super Admin mis à jour');
    
    await pool.query(
      "UPDATE users SET password = $1 WHERE email = 'admin@unikin.ac.cd'",
      [adminHash]
    );
    console.log('✅ Mot de passe Admin mis à jour');
    
    // Vérifier
    const result = await pool.query(
      "SELECT email, password FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN')"
    );
    
    for (const user of result.rows) {
      const testPwd = user.email === 'admin@unikin.ac.cd' ? 'admin123' : 'superadmin123';
      const match = await bcrypt.compare(testPwd, user.password);
      console.log(`${user.email}: mot de passe valide = ${match}`);
    }
    
  } catch (e) {
    console.error('Erreur:', e.message);
  } finally {
    pool.end();
  }
}

fixPasswords();
