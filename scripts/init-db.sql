-- =====================================================
-- SGR-UNIKIN Database Schema for PostgreSQL
-- =====================================================

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Types ENUM
-- =====================================================

CREATE TYPE user_role AS ENUM ('STUDENT', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE validation_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE study_level AS ENUM ('LICENCE', 'MASTER', 'DOCTORAT');
CREATE TYPE dossier_status AS ENUM ('DRAFT', 'SUBMITTED', 'VALIDATED', 'COMPLETED');
CREATE TYPE appointment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- =====================================================
-- Table: users
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role user_role DEFAULT 'STUDENT' NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    verify_token VARCHAR(255) UNIQUE,
    verify_expires TIMESTAMP WITH TIME ZONE,
    reset_token VARCHAR(255) UNIQUE,
    reset_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_verify_token ON users(verify_token);
CREATE INDEX idx_users_reset_token ON users(reset_token);

-- =====================================================
-- Table: students
-- =====================================================

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Informations personnelles
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    place_of_birth VARCHAR(255),
    nationality VARCHAR(100) DEFAULT 'Congolaise' NOT NULL,
    gender VARCHAR(20),
    phone VARCHAR(50),
    address TEXT,
    
    -- Informations académiques
    matricule VARCHAR(100) UNIQUE,
    faculty VARCHAR(255),
    department VARCHAR(255),
    study_level study_level DEFAULT 'DOCTORAT' NOT NULL,
    specialization VARCHAR(255),
    thesis_title TEXT,
    supervisor VARCHAR(255),
    co_supervisor VARCHAR(255),
    
    -- Statut d'inscription
    current_step INTEGER DEFAULT 0 NOT NULL,
    max_steps INTEGER DEFAULT 4 NOT NULL,
    is_complete BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Gestion du dossier
    dossier_status dossier_status DEFAULT 'DRAFT' NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    draft_expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_matricule ON students(matricule);
CREATE INDEX idx_students_faculty ON students(faculty);
CREATE INDEX idx_students_dossier_status ON students(dossier_status);

-- =====================================================
-- Table: documents
-- =====================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    size INTEGER,
    mime_type VARCHAR(100),
    
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_documents_student_id ON documents(student_id);
CREATE INDEX idx_documents_type ON documents(type);

-- =====================================================
-- Table: validations
-- =====================================================

CREATE TABLE validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    step INTEGER NOT NULL,
    status validation_status DEFAULT 'PENDING' NOT NULL,
    comment TEXT,
    validated_by VARCHAR(255),
    validated_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    UNIQUE(student_id, step)
);

CREATE INDEX idx_validations_student_id ON validations(student_id);
CREATE INDEX idx_validations_status ON validations(status);

-- =====================================================
-- Table: appointments
-- =====================================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    target_role VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT,
    requested_date TIMESTAMP WITH TIME ZONE NOT NULL,
    approved_date TIMESTAMP WITH TIME ZONE,
    admin_note TEXT,
    status appointment_status DEFAULT 'PENDING' NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_appointments_student_id ON appointments(student_id);
CREATE INDEX idx_appointments_status ON appointments(status);

-- =====================================================
-- Table: faculties
-- =====================================================

CREATE TABLE faculties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL
);

-- =====================================================
-- Table: departments
-- =====================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    
    UNIQUE(faculty_id, code)
);

CREATE INDEX idx_departments_faculty_id ON departments(faculty_id);

-- =====================================================
-- Table: admin_reviews
-- =====================================================

CREATE TABLE admin_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    step INTEGER NOT NULL,
    decision VARCHAR(50) NOT NULL,
    comment TEXT,
    is_private BOOLEAN DEFAULT TRUE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_admin_reviews_student_id ON admin_reviews(student_id);
CREATE INDEX idx_admin_reviews_admin_id ON admin_reviews(admin_id);

-- =====================================================
-- Fonction pour mettre à jour updated_at automatiquement
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_validations_updated_at BEFORE UPDATE ON validations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_reviews_updated_at BEFORE UPDATE ON admin_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Données initiales
-- =====================================================

-- Insertion des utilisateurs par défaut (mots de passe hashés avec bcrypt)
-- superadmin123 -> $2a$10$...
-- admin123 -> $2a$10$...
-- etudiant123 -> $2a$10$...

INSERT INTO users (email, password, name, role, email_verified) VALUES
('sg.recherche@unikin.ac.cd', '$2a$10$8KvD5FqkjP8x7y3q8Z1u5eYz9wKmN3rT6vB4xC2nM1pQ8sL7jH5iO', 'Super Admin SGR', 'SUPER_ADMIN', TRUE),
('admin@unikin.ac.cd', '$2a$10$8KvD5FqkjP8x7y3q8Z1u5eYz9wKmN3rT6vB4xC2nM1pQ8sL7jH5iO', 'Administrateur', 'ADMIN', TRUE);

-- Insertion des facultés
INSERT INTO faculties (name, code) VALUES
('Faculté des Sciences', 'FSC'),
('Faculté de Médecine', 'FMED'),
('Faculté de Droit', 'FDRT'),
('Faculté des Lettres et Sciences Humaines', 'FLSH'),
('Faculté des Sciences Économiques et de Gestion', 'FSEG'),
('Faculté Polytechnique', 'FPOLY'),
('Faculté des Sciences Agronomiques', 'FSA'),
('Faculté de Psychologie et des Sciences de l''Éducation', 'FPSE'),
('Faculté des Sciences Pharmaceutiques', 'FPHA'),
('Faculté des Sciences Sociales, Administratives et Politiques', 'FSSAP'),
('Faculté de Pétrole, Gaz et Énergies Nouvelles', 'FPGEN'),
('Faculté d''Architecture et Urbanisme', 'FAU'),
('Faculté de Médecine Vétérinaire', 'FMV');
