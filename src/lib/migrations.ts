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

    // Create admin_activity_logs table for full audit trail
    await query(`
      CREATE TABLE IF NOT EXISTS admin_activity_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action_type VARCHAR(50) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(255),
        details JSONB DEFAULT '{}',
        ip_address VARCHAR(45),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Admin activity logs table created');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_admin ON admin_activity_logs(admin_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON admin_activity_logs(created_at DESC);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON admin_activity_logs(action_type);
    `);
    console.log('✅ Admin activity logs indexes created');

    // Create otp_codes table for OTP password recovery
    await query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        attempts INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ OTP codes table created');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_otp_codes_user ON otp_codes(user_id);
    `);
    console.log('✅ OTP codes index created');

    // Allow guest appointments (no student account required)
    try {
      await query(`
        ALTER TABLE appointments 
        ALTER COLUMN student_id DROP NOT NULL
      `);
    } catch {
      // Column may already be nullable
    }
    await query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(50)
    `);
    console.log('✅ Guest appointment columns added');

    // Add committee_members column to students
    await query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS committee_members TEXT
    `);
    console.log('✅ Committee members column added');

    // Add reference_number column to students (assigned at physical reception)
    await query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS reference_number VARCHAR(50)
    `);
    console.log('✅ Reference number column added');

    // Create password_reset_requests table for admin-approved password resets
    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        token VARCHAR(255),
        expires_at TIMESTAMP WITH TIME ZONE,
        approved_by UUID REFERENCES users(id),
        approved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_requests_user ON password_reset_requests(user_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status ON password_reset_requests(status);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_requests_token ON password_reset_requests(token);
    `);
    console.log('✅ Password reset requests table created');

    // Fix: étudiants non soumis doivent être au step 0
    const fixResult = await query(`
      UPDATE students SET current_step = 0 
      WHERE dossier_status = 'DRAFT' AND current_step > 0
    `);
    if (fixResult.rowCount && fixResult.rowCount > 0) {
      console.log(`✅ ${fixResult.rowCount} étudiant(s) non soumis remis au niveau 0`);
    }

    // Create rdv_authorities table for configurable RDV authorities
    await query(`
      CREATE TABLE IF NOT EXISTS rdv_authorities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        value VARCHAR(50) NOT NULL UNIQUE,
        nom VARCHAR(255) NOT NULL,
        fonction VARCHAR(255) NOT NULL,
        description VARCHAR(500),
        initiales VARCHAR(10),
        display_order INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ RDV authorities table created');

    // Seed default authorities if empty
    const existingAuth = await query('SELECT COUNT(*) as count FROM rdv_authorities');
    if (parseInt(existingAuth.rows[0].count) === 0) {
      await query(`
        INSERT INTO rdv_authorities (value, nom, fonction, description, initiales, display_order) VALUES
        ('SGR', 'Prof. Paulin MUTWALE KAPEPULA', 'SGR', 'Secrétaire Général à la Recherche', 'PMK', 1),
        ('AP', 'Prof. KAPEMBO Michel', 'Assistant Principal', 'Assistant Principal du SGR', 'KM', 2),
        ('CHARGE_PUBLICATIONS', 'Chargé des Publications', 'Publications et Recherche', 'Publications et recherche scientifique', 'CP', 3),
        ('CHARGE_ANTIPLAGIAT', 'Chargé Anti-plagiat', 'Check Anti-plagiat', 'Vérification anti-plagiat des travaux', 'CA', 4),
        ('CHARGE_OIPR', 'Chargé de l''OIPR', 'OIPR', 'Outil d''Inventaire et de Planification de la Recherche', 'CO', 5)
      `);
      console.log('✅ Default RDV authorities seeded');
    }

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
