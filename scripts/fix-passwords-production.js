/**
 * Script pour corriger les mots de passe admin en production
 * Usage: DATABASE_URL="postgresql://..." node scripts/fix-passwords-production.js
 */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sgr_unikin',
  user: 'sgr_user',
  password: 'SgrUnikin2026!Secure',
});

async function fixAllPasswords() {
  try {
    console.log('🔧 Correction des mots de passe en production...\n');
    
    // Mot de passe unique pour tous les admins/super admins
    const password = 'Admin@SGR2026!';
    const hash = await bcrypt.hash(password, 10);
    
    // Vérifier le hash
    const ok = await bcrypt.compare(password, hash);
    console.log(`✅ Vérification hash: ${ok}\n`);
    
    if (!ok) {
      console.error('❌ Erreur de génération de hash. Abandon.');
      process.exit(1);
    }

    // Mettre à jour TOUS les utilisateurs (admins + super admins)
    const result = await pool.query(
      "UPDATE users SET password = $1 WHERE role IN ('ADMIN', 'SUPER_ADMIN')",
      [hash]
    );
    console.log(`${result.rowCount} utilisateurs mis à jour\n`);

    // Vérification finale
    console.log('🔍 Vérification finale...');
    const allUsers = await pool.query(
      "SELECT email, name, role, admin_level, password FROM users ORDER BY role DESC, admin_level DESC NULLS LAST, email"
    );
    
    for (const user of allUsers.rows) {
      const match = await bcrypt.compare(password, user.password);
      console.log(`${match ? '✅' : '❌'} [${user.role}${user.admin_level ? ' Niv.' + user.admin_level : ''}] ${user.email} (${user.name})`);
    }
    
    console.log(`\n🎉 Terminé ! Mot de passe pour tous: ${password}`);
  } catch (e) {
    console.error('❌ Erreur:', e.message);
  } finally {
    pool.end();
  }
}

fixAllPasswords();
