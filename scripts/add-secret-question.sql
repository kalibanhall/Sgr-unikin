-- =====================================================
-- Migration: Add Secret Question for Password Recovery
-- =====================================================

-- Add columns to users table for secret question recovery
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS secret_question VARCHAR(255),
ADD COLUMN IF NOT EXISTS secret_answer VARCHAR(255),
ADD COLUMN IF NOT EXISTS failed_reset_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reset_locked_until TIMESTAMP WITH TIME ZONE;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_users_reset_locked ON users(reset_locked_until);

-- Make Jonathan Mutwale a SUPER_ADMIN (if exists)
UPDATE users 
SET role = 'SUPER_ADMIN' 
WHERE email ILIKE '%mutwale%' OR name ILIKE '%mutwale%';

-- Show updated user
SELECT id, email, name, role FROM users WHERE email ILIKE '%mutwale%' OR name ILIKE '%mutwale%';
