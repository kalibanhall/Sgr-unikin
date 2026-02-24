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

    // Create technical_validations table for double validation on technical step
    await query(`
      CREATE TABLE IF NOT EXISTS technical_validations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        step INTEGER NOT NULL,
        admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
        comment TEXT,
        validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(student_id, step, admin_id)
      )
    `);
    console.log('✅ Technical validations table created');

    // Create index for technical_validations
    await query(`
      CREATE INDEX IF NOT EXISTS idx_technical_validations_student_step 
      ON technical_validations(student_id, step)
    `);
    console.log('✅ Technical validations index created');

    // Add is_appointment_manager column
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_appointment_manager BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Appointment manager column added');

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
