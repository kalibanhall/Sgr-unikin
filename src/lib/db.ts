import { Pool, PoolClient, QueryResult } from 'pg';

// Configuration du pool de connexions PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Événements du pool
pool.on('connect', () => {
  console.log('Connexion PostgreSQL établie');
});

pool.on('error', (err) => {
  console.error('Erreur PostgreSQL inattendue:', err);
});

// Fonction pour exécuter une requête simple
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Query exécutée', { text: text.substring(0, 50), duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('Erreur SQL:', error);
    throw error;
  }
}

// Fonction pour obtenir un client du pool (pour les transactions)
export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

// Fonction pour exécuter une transaction
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Fermer le pool (pour les tests ou le shutdown)
export async function closePool(): Promise<void> {
  await pool.end();
}

// Export du pool pour usage direct si nécessaire
export { pool };

// Types pour les modèles
export interface User {
  id: string;
  email: string;
  password: string;
  name: string | null;
  role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
  email_verified: boolean;
  verify_token: string | null;
  verify_expires: Date | null;
  reset_token: string | null;
  reset_expires: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Student {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: Date | null;
  place_of_birth: string | null;
  nationality: string;
  gender: string | null;
  phone: string | null;
  address: string | null;
  matricule: string | null;
  faculty: string | null;
  department: string | null;
  study_level: 'LICENCE' | 'MASTER' | 'DOCTORAT';
  specialization: string | null;
  thesis_title: string | null;
  supervisor: string | null;
  co_supervisor: string | null;
  current_step: number;
  max_steps: number;
  is_complete: boolean;
  dossier_status: 'DRAFT' | 'SUBMITTED' | 'VALIDATED' | 'COMPLETED';
  submitted_at: Date | null;
  draft_expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Document {
  id: string;
  student_id: string;
  name: string;
  type: string;
  url: string;
  size: number | null;
  mime_type: string | null;
  uploaded_at: Date;
}

export interface Validation {
  id: string;
  student_id: string;
  step: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment: string | null;
  validated_by: string | null;
  validated_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Appointment {
  id: string;
  student_id: string;
  target_role: string;
  subject: string;
  message: string | null;
  requested_date: Date;
  approved_date: Date | null;
  admin_note: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: Date;
  updated_at: Date;
}

export interface Faculty {
  id: string;
  name: string;
  code: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  faculty_id: string;
}

export interface AdminReview {
  id: string;
  student_id: string;
  admin_id: string;
  step: number;
  decision: string;
  comment: string | null;
  is_private: boolean;
  created_at: Date;
  updated_at: Date;
}

// Helpers pour générer des IDs
export function generateId(): string {
  return crypto.randomUUID();
}
