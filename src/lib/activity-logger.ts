import { activityLogRepository } from './repositories';
import { headers } from 'next/headers';

// Action types constants
export const ACTION_TYPES = {
  // Student validation
  VALIDATE_STEP: 'VALIDATE_STEP',
  REJECT_STEP: 'REJECT_STEP',
  
  // User management
  CREATE_ADMIN: 'CREATE_ADMIN',
  UPDATE_ADMIN: 'UPDATE_ADMIN',
  DELETE_ADMIN: 'DELETE_ADMIN',
  RESET_USER_PASSWORD: 'RESET_USER_PASSWORD',
  
  // Appointments
  APPROVE_APPOINTMENT: 'APPROVE_APPOINTMENT',
  REJECT_APPOINTMENT: 'REJECT_APPOINTMENT',
  
  // Login
  ADMIN_LOGIN: 'ADMIN_LOGIN',
  
  // Other
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
} as const;

export const ACTION_TYPE_LABELS: Record<string, string> = {
  VALIDATE_STEP: 'Validation d\'étape',
  REJECT_STEP: 'Rejet d\'étape',
  CREATE_ADMIN: 'Création administrateur',
  UPDATE_ADMIN: 'Modification administrateur',
  DELETE_ADMIN: 'Suppression administrateur',
  RESET_USER_PASSWORD: 'Réinitialisation mot de passe',
  APPROVE_APPOINTMENT: 'Approbation rendez-vous',
  REJECT_APPOINTMENT: 'Rejet rendez-vous',
  ADMIN_LOGIN: 'Connexion admin',
  UPDATE_SETTINGS: 'Modification paramètres',
};

export const TARGET_TYPE_LABELS: Record<string, string> = {
  STUDENT: 'Étudiant',
  USER: 'Utilisateur',
  APPOINTMENT: 'Rendez-vous',
  SETTINGS: 'Paramètres',
};

async function getClientIP(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
      || headersList.get('x-real-ip')
      || null;
  } catch {
    return null;
  }
}

export async function logActivity(data: {
  adminId: string;
  actionType: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const ipAddress = await getClientIP();
    await activityLogRepository.create({
      ...data,
      ipAddress: ipAddress || undefined,
    });
  } catch (error) {
    // Never let logging break the main flow
    console.error('Activity log error:', error);
  }
}
