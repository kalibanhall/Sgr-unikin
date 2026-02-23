import { query } from './db';

// Run database migrations
export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Add secret question columns
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS secret_question VARCHAR(255),
      ADD COLUMN IF NOT EXISTS secret_answer VARCHAR(255),
      ADD COLUMN IF NOT EXISTS failed_reset_attempts INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS reset_locked_until TIMESTAMP WITH TIME ZONE
    `);
    console.log('✅ Secret question columns added');

    // Add dossier_type column for multiple request types
    await query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS dossier_type VARCHAR(50) DEFAULT 'INSCRIPTION'
    `);
    console.log('✅ Dossier type column added');

    // Promote Jonathan Mutwale to SUPER_ADMIN if exists
    const result = await query(`
      UPDATE users 
      SET role = 'SUPER_ADMIN' 
      WHERE (email ILIKE '%mutwale%' OR name ILIKE '%jonathan%mutwale%')
      AND role != 'SUPER_ADMIN'
      RETURNING email, name, role
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Promoted to SUPER_ADMIN:', result.rows.map(r => r.email).join(', '));
    }

    console.log('✅ All migrations completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration error:', error);
    // Don't throw - let the app continue even if migrations fail
    return false;
  }
}
