import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().optional(),
  studyLevel: z.enum(["LICENCE", "MASTER", "DOCTORAT"]),
  faculty: z.string().min(1, "Veuillez sélectionner une faculté"),
  department: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const studentProfileSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  nationality: z.string().default("Congolaise"),
  gender: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  faculty: z.string().optional(),
  department: z.string().optional(),
  studyLevel: z.enum(["LICENCE", "MASTER", "DOCTORAT"]),
  specialization: z.string().optional(),
  thesisTitle: z.string().optional(),
  supervisor: z.string().optional(),
  coSupervisor: z.string().optional(),
});

export const appointmentSchema = z.object({
  targetRole: z.string().min(1, "Veuillez sélectionner un destinataire"),
  subject: z.string().min(5, "Le sujet doit contenir au moins 5 caractères"),
  message: z.string().optional(),
  requestedDate: z.string().min(1, "Veuillez sélectionner une date"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
