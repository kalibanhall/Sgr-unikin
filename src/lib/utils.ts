import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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
