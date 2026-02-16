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
    admin_level INTEGER,
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
    max_steps INTEGER DEFAULT 5 NOT NULL,
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
-- superadmin123 -> $2b$10$25/iCZhv2O.Q3HAzZaP14u12y/s2gu5K18LY.8Ny/MvKdNwWz7F8a
-- admin123 -> $2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS

INSERT INTO users (email, password, name, role, admin_level, email_verified) VALUES
-- Super Admin
('sg.recherche@unikin.ac.cd', '$2b$10$25/iCZhv2O.Q3HAzZaP14u12y/s2gu5K18LY.8Ny/MvKdNwWz7F8a', 'Super Admin SGR', 'SUPER_ADMIN', 5, TRUE),
-- Niveau 5 : Direction
('jonathanmukanya9@gmail.com', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Jonathan Mukanya Mpoyi', 'ADMIN', 5, TRUE),
('garaphmutwal@yahoo.fr', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Paulin Mutwale Kapepula', 'ADMIN', 5, TRUE),
-- Niveau 4 : Validation finale
('yvettepoungam@gmail.com', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Estelle Yvette Poungam', 'ADMIN', 4, TRUE),
('michel.kapembo@unikin.ac.cd', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Michel Kapembo', 'ADMIN', 4, TRUE),
-- Niveau 3 : Analyse technique
('sebastienbayauli@gmail.com', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Sébastien Bayauli', 'ADMIN', 3, TRUE),
('nancy.niemba@unikin.ac.cd', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Nancy Niemba', 'ADMIN', 3, TRUE),
('osee@unikin.ac.cd', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Osée', 'ADMIN', 3, TRUE),
-- Niveau 2 : Analyse technique du dossier
('hugotamina@gmail.com', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Hugo Tamina Maloya', 'ADMIN', 2, TRUE),
('emmanuel.djamba@unikin.ac.cd', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Djamba Okenda Emmanuel', 'ADMIN', 2, TRUE),
('harry.kayembe@unikin.ac.cd', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Harry Kayembe', 'ADMIN', 2, TRUE),
('jimmykabeya@unikin.ac.cd', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Jimmy Kabeya', 'ADMIN', 2, TRUE),
-- Niveau 1 : Soumission / Accueil / Rendez-vous
('lisabokuma2@gmail.com', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Lisa Bokuma', 'ADMIN', 1, TRUE),
('mosesmutamba52@gmail.com', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Moïse Mulumba', 'ADMIN', 1, TRUE),
('bigohealex@gmail.com', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Alex Bigohe', 'ADMIN', 1, TRUE),
('nathalie@unikin.ac.cd', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Nathalie', 'ADMIN', 1, TRUE),
('ines@unikin.ac.cd', '$2b$10$t0CtopFjSEcTiWxB5Obfh.ECcESfPljItmwkZgCW7sF3gfScekhDS', 'Inès', 'ADMIN', 1, TRUE);

-- Insertion des facultés
INSERT INTO faculties (name, code) VALUES
('Sciences Économiques et de Gestion', 'ECOGEST'),
('Médecine Dentaire', 'MEDDENT'),
('Sciences Sociales, Administratives et Politiques', 'SSAP'),
('Sciences et Technologies', 'SCITECH'),
('Sciences Agronomiques et Environnement', 'AGROENV'),
('Pétrole, Gaz et Énergies Renouvelables', 'PETRO'),
('Médecine Vétérinaire', 'VETERINAIRE'),
('Sciences Pharmaceutiques', 'PHARMA'),
('Lettres et Sciences Humaines', 'LETTRES'),
('Polytechnique', 'POLYTECH'),
('Psychologie et Sciences de l''Éducation', 'PSYCHO'),
('Droit', 'DROIT'),
('Médecine', 'MEDECINE');

-- Insertion des départements
-- ECOGEST
INSERT INTO departments (name, code, faculty_id)
SELECT d.name, d.code, f.id FROM faculties f,
(VALUES
  ('Sciences Économiques', 'ECOGEST-DEP1'),
  ('Sciences de gestion', 'ECOGEST-DEP2'),
  ('Informatique de gestion et anglais des affaires', 'ECOGEST-DEP3')
) AS d(name, code)
WHERE f.code = 'ECOGEST';

-- MEDDENT
INSERT INTO departments (name, code, faculty_id)
SELECT d.name, d.code, f.id FROM faculties f,
(VALUES
  ('Prothèse et maxillo-faciale', 'MEDDENT-DEP1'),
  ('Dentisterie opératoire', 'MEDDENT-DEP2'),
  ('Pédodontie', 'MEDDENT-DEP3'),
  ('Chirurgie orale et maxillo-faciale', 'MEDDENT-DEP4'),
  ('Paradontologie', 'MEDDENT-DEP5'),
  ('Orthopédie Dento-faciale', 'MEDDENT-DEP6'),
  ('Santé publique', 'MEDDENT-DEP7'),
  ('Sciences de base', 'MEDDENT-DEP8')
) AS d(name, code)
WHERE f.code = 'MEDDENT';

-- SSAP
INSERT INTO departments (name, code, faculty_id)
SELECT d.name, d.code, f.id FROM faculties f,
(VALUES
  ('Sciences politiques', 'SSAP-DEP1'),
  ('Relation internationale', 'SSAP-DEP2'),
  ('Anthropologie', 'SSAP-DEP3'),
  ('Sociologie', 'SSAP-DEP4'),
  ('Sciences du travail', 'SSAP-DEP5')
) AS d(name, code)
WHERE f.code = 'SSAP';

-- SCITECH
INSERT INTO departments (name, code, faculty_id)
SELECT d.name, d.code, f.id FROM faculties f,
(VALUES
  ('Chimie et Industrie', 'SCITECH-DEP1'),
  ('Géo Sciences', 'SCITECH-DEP2'),
  ('Sciences et gestion de l''environnement', 'SCITECH-DEP3'),
  ('Mathématique, Statistiques et Informatique', 'SCITECH-DEP4'),
  ('Physique et Technologies', 'SCITECH-DEP5'),
  ('Sciences de la vie', 'SCITECH-DEP6')
) AS d(name, code)
WHERE f.code = 'SCITECH';

-- AGROENV
INSERT INTO departments (name, code, faculty_id)
SELECT d.name, d.code, f.id FROM faculties f,
(VALUES
  ('Production animale', 'AGROENV-DEP1'),
  ('Production végétale', 'AGROENV-DEP2'),
  ('Technologies agroindustrielle', 'AGROENV-DEP3'),
  ('Agro économie', 'AGROENV-DEP4'),
  ('Gestion des ressources naturelles', 'AGROENV-DEP5')
) AS d(name, code)
WHERE f.code = 'AGROENV';

-- PETRO
INSERT INTO departments (name, code, faculty_id)
SELECT d.name, d.code, f.id FROM faculties f,
(VALUES
  ('Gestion et économie pétrolière et gazière', 'PETRO-DEP1'),
  ('Exploitation et production pétrolière et Forage', 'PETRO-DEP2'),
  ('Raffinage et pétrochimie', 'PETRO-DEP3'),
  ('Génie des énergies renouvelables et environnement', 'PETRO-DEP4')
) AS d(name, code)
WHERE f.code = 'PETRO';

-- VETERINAIRE
INSERT INTO departments (name, code, faculty_id)
SELECT d.name, d.code, f.id FROM faculties f,
(VALUES
  ('Sciences de base', 'VETERINAIRE-DEP1'),
  ('Zootechnie', 'VETERINAIRE-DEP2'),
  ('Sciences précliniques', 'VETERINAIRE-DEP3'),
  ('Clinique', 'VETERINAIRE-DEP4')
) AS d(name, code)
WHERE f.code = 'VETERINAIRE';

-- PHARMA
INSERT INTO departments (name, code, faculty_id)
SELECT d.name, d.code, f.id FROM faculties f,
(VALUES
  ('Galénique et analyse des médicaments', 'PHARMA-DEP1'),
  ('Sciences de base', 'PHARMA-DEP2'),
  ('Sciences Biopharmaceutiques et Alimentaires', 'PHARMA-DEP3'),
  ('Pharmacologie et thérapeutique', 'PHARMA-DEP4'),
  ('Chimie Médicale et Pharmacognosie', 'PHARMA-DEP5')
) AS d(name, code)
WHERE f.code = 'PHARMA';

-- LETTRES
INSERT INTO departments (name, code, faculty_id)
SELECT d.name, d.code, f.id FROM faculties f,
(VALUES
  ('Lettres et Civilisations Françaises', 'LETTRES-DEP1'),
  ('Philosophie', 'LETTRES-DEP2'),
  ('Sciences techniques et documentaires', 'LETTRES-DEP3'),
  ('Sciences de l''Information et de la communication', 'LETTRES-DEP4'),
  ('Sciences historiques, de gestion et du patrimoine et développement', 'LETTRES-DEP5'),
  ('Lettres et Civilisations Anglaises', 'LETTRES-DEP6'),
  ('Lettres et Civilisations Africaines', 'LETTRES-DEP7'),
  ('Langues et informatique appliquée aux affaires et commerce', 'LETTRES-DEP8'),
  ('Traduction et interprétariat', 'LETTRES-DEP9'),
  ('Lettres-Arts de spectacle Africain et patrimoine culturels', 'LETTRES-DEP10'),
  ('Ecoles des langues vivantes', 'LETTRES-DEP11')
) AS d(name, code)
WHERE f.code = 'LETTRES';

-- POLYTECH
INSERT INTO departments (name, code, faculty_id)
SELECT d.name, d.code, f.id FROM faculties f,
(VALUES
  ('Génie civil', 'POLYTECH-DEP1'),
  ('Génie mécanique', 'POLYTECH-DEP2'),
  ('Génie électrique et informatique', 'POLYTECH-DEP3'),
  ('Sciences de base (L1 + Préparatoire)', 'POLYTECH-DEP4')
) AS d(name, code)
WHERE f.code = 'POLYTECH';

-- PSYCHO
INSERT INTO departments (name, code, faculty_id)
SELECT d.name, d.code, f.id FROM faculties f,
(VALUES
  ('Sciences de l''éducation', 'PSYCHO-DEP1'),
  ('Psychologie', 'PSYCHO-DEP2'),
  ('Gestion des entreprises', 'PSYCHO-DEP3'),
  ('Agrégation', 'PSYCHO-DEP4')
) AS d(name, code)
WHERE f.code = 'PSYCHO';

-- DROIT
INSERT INTO departments (name, code, faculty_id)
SELECT d.name, d.code, f.id FROM faculties f,
(VALUES
  ('Droit public interne', 'DROIT-DEP1'),
  ('Droit international public et Relations internationales', 'DROIT-DEP2'),
  ('Droit économique et social', 'DROIT-DEP3'),
  ('Droit de l''Homme', 'DROIT-DEP4'),
  ('Droit Pénal et Criminologie', 'DROIT-DEP5'),
  ('Droit privé et judiciaire', 'DROIT-DEP6'),
  ('Droit de l''environnement et Développement Durable', 'DROIT-DEP7')
) AS d(name, code)
WHERE f.code = 'DROIT';

-- MEDECINE
INSERT INTO departments (name, code, faculty_id)
SELECT d.name, d.code, f.id FROM faculties f,
(VALUES
  ('Chirurgie', 'MEDECINE-DEP1'),
  ('Médecine interne', 'MEDECINE-DEP2'),
  ('Gynécologie et Obstétrique', 'MEDECINE-DEP3'),
  ('Pédiatrie', 'MEDECINE-DEP4'),
  ('Anesthésie et réanimation', 'MEDECINE-DEP5'),
  ('Psychiatrie', 'MEDECINE-DEP6'),
  ('Neurologie', 'MEDECINE-DEP7'),
  ('Épidémiologie et biostatistique', 'MEDECINE-DEP8'),
  ('Nutrition', 'MEDECINE-DEP9'),
  ('Santé et environnement', 'MEDECINE-DEP10'),
  ('Santé communautaire', 'MEDECINE-DEP11'),
  ('Management et politique de santé', 'MEDECINE-DEP12'),
  ('Spécialités', 'MEDECINE-DEP13'),
  ('Médecine physique et réadaptation', 'MEDECINE-DEP14'),
  ('Médecine tropicale', 'MEDECINE-DEP15')
) AS d(name, code)
WHERE f.code = 'MEDECINE';
