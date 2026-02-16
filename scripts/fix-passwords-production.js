/**
 * Script pour corriger les mots de passe admin en production
 * Usage: DATABASE_URL="postgresql://..." node scripts/fix-passwords-production.js
 */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixAllPasswords() {
  try {
    console.log('🔧 Correction des mots de passe admin en production...\n');
    
    // Générer les hash corrects
    const superadminHash = await bcrypt.hash('superadmin123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);
    
    // Vérifier les hash
    const saOk = await bcrypt.compare('superadmin123', superadminHash);
    const adOk = await bcrypt.compare('admin123', adminHash);
    console.log(`✅ Vérification hash superadmin: ${saOk}`);
    console.log(`✅ Vérification hash admin: ${adOk}\n`);
    
    if (!saOk || !adOk) {
      console.error('❌ Erreur de génération de hash. Abandon.');
      process.exit(1);
    }

    // Mettre à jour le super admin
    const result1 = await pool.query(
      "UPDATE users SET password = $1 WHERE email = 'sg.recherche@unikin.ac.cd' AND role = 'SUPER_ADMIN'",
      [superadminHash]
    );
    console.log(`Super Admin (sg.recherche@unikin.ac.cd): ${result1.rowCount} mis à jour`);

    // Mettre à jour tous les admins
    const adminEmails = [
      'jonathanmukanya9@gmail.com',
      'garaphmutwal@yahoo.fr',
      'yvettepoungam@gmail.com',
      'michel.kapembo@unikin.ac.cd',
      'sebastienbayauli@gmail.com',
      'nancy.niemba@unikin.ac.cd',
      'osee@unikin.ac.cd',
      'hugotamina@gmail.com',
      'emmanuel.djamba@unikin.ac.cd',
      'harry.kayembe@unikin.ac.cd',
      'jimmykabeya@unikin.ac.cd',
      'lisabokuma2@gmail.com',
      'mosesmutamba52@gmail.com',
      'bigohealex@gmail.com',
      'nathalie@unikin.ac.cd',
      'ines@unikin.ac.cd',
    ];

    for (const email of adminEmails) {
      const result = await pool.query(
        "UPDATE users SET password = $1 WHERE email = $2",
        [adminHash, email]
      );
      console.log(`${email}: ${result.rowCount > 0 ? '✅' : '⚠️ non trouvé'}`);
    }

    // Mettre à jour aussi les noms complets
    const nameUpdates = [
      ['jonathanmukanya9@gmail.com', 'Jonathan Mukanya Mpoyi'],
      ['garaphmutwal@yahoo.fr', 'Paulin Mutwale Kapepula'],
      ['hugotamina@gmail.com', 'Hugo Tamina Maloya'],
      ['emmanuel.djamba@unikin.ac.cd', 'Djamba Okenda Emmanuel'],
    ];

    console.log('\n📝 Mise à jour des noms...');
    for (const [email, name] of nameUpdates) {
      await pool.query("UPDATE users SET name = $1 WHERE email = $2", [name, email]);
      console.log(`${email} → ${name}`);
    }

    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    const allAdmins = await pool.query(
      "SELECT email, name, role, admin_level, password FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN') ORDER BY admin_level DESC, email"
    );
    
    for (const user of allAdmins.rows) {
      const testPwd = user.role === 'SUPER_ADMIN' ? 'superadmin123' : 'admin123';
      const match = await bcrypt.compare(testPwd, user.password);
      console.log(`${match ? '✅' : '❌'} [Niv.${user.admin_level}] ${user.email} (${user.name}) - pwd: ${testPwd}`);
    }
    
    console.log('\n🎉 Terminé !');
  } catch (e) {
    console.error('❌ Erreur:', e.message);
  } finally {
    pool.end();
  }
}

fixAllPasswords();
