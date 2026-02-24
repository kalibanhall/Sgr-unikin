// Script to check super admins in the database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
});

async function checkSuperAdmins() {
  try {
    console.log('Connecting to database...');
    
    // Get all super admins
    const result = await pool.query(`
      SELECT id, email, name, role, admin_level, created_at 
      FROM users 
      WHERE role = 'SUPER_ADMIN'
      ORDER BY created_at DESC
    `);
    
    console.log('\n=== SUPER_ADMIN Users ===');
    if (result.rows.length === 0) {
      console.log('No SUPER_ADMIN users found!');
    } else {
      result.rows.forEach(user => {
        console.log(`- ${user.name || 'N/A'} (${user.email}) - Level: ${user.admin_level || 'N/A'} - Created: ${user.created_at}`);
      });
    }
    
    // Check if Jonathan exists
    const jonathanResult = await pool.query(`
      SELECT id, email, name, role, admin_level 
      FROM users 
      WHERE name ILIKE '%jonathan%' OR name ILIKE '%mutwale%' OR email ILIKE '%mutwale%'
    `);
    
    console.log('\n=== Users matching "Jonathan" or "Mutwale" ===');
    if (jonathanResult.rows.length === 0) {
      console.log('No users found matching Jonathan or Mutwale');
    } else {
      jonathanResult.rows.forEach(user => {
        console.log(`- ${user.name || 'N/A'} (${user.email}) - Role: ${user.role} - Level: ${user.admin_level || 'N/A'}`);
      });
    }
    
    // List all admins (both ADMIN and SUPER_ADMIN)
    const allAdmins = await pool.query(`
      SELECT id, email, name, role, admin_level 
      FROM users 
      WHERE role IN ('ADMIN', 'SUPER_ADMIN')
      ORDER BY role DESC, name ASC
    `);
    
    console.log('\n=== All Admin Users ===');
    allAdmins.rows.forEach(user => {
      console.log(`- [${user.role}] ${user.name || 'N/A'} (${user.email}) - Level: ${user.admin_level || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSuperAdmins();
