import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Date non disponible";
  
  try {
    const parsedDate = new Date(date);
    
    // Vérifier si la date est valide
    if (isNaN(parsedDate.getTime())) {
      return "Date non disponible";
    }
    
    return parsedDate.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "Date non disponible";
  }
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "Date non disponible";
  
  try {
    const parsedDate = new Date(date);
    
    if (isNaN(parsedDate.getTime())) {
      return "Date non disponible";
    }
    
    return parsedDate.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Date non disponible";
  }
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return "";
    
    const now = new Date();
    const diffMs = now.getTime() - parsedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} an(s)`;
  } catch {
    return "";
  }
}

export function getStepLabel(step: number): string {
  const steps = [
    "Inscription initiale",
    "Vérification des documents",
    "Validation académique",
    "Validation administrative",
    "Inscription complète",
  ];
  return steps[step] || `Étape ${step}`;
}

export function getStudyLevelLabel(level: string): string {
  const levels: Record<string, string> = {
    LICENCE: "Licence (L3)",
    MASTER: "Master",
    DOCTORAT: "Doctorat (PhD)",
  };
  return levels[level] || level;
}
