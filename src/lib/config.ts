// Configuration centralisée de l'application
// Modifiez ces valeurs selon vos besoins

import path from "path";

// Répertoire de stockage des fichiers uploadés
// Sur Render avec Disk: /opt/render/project/src/uploads (persistant)
// En local: <cwd>/uploads
export function getUploadDir(...subPaths: string[]): string {
  const base = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
  return subPaths.length > 0 ? path.join(base, ...subPaths) : base;
}

export const APP_CONFIG = {
  // Informations de l'organisation
  organization: {
    name: "Secrétariat Général à la Recherche",
    shortName: "SGR-UNIKIN",
    university: "Université de Kinshasa",
    motto: "Excellence – Intégrité – Redevabilité",
    latinMotto: "Scientia Splendet et Conscientia",
  },

  // Contact
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "sg.recherche@unikin.ac.cd",
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+243 852024984",
    address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "Université de Kinshasa, Mont Amba, Kinshasa, RDC",
    website: process.env.NEXT_PUBLIC_WEBSITE || "https://sgr.unikin.ac.cd",
  },

  // Réseaux sociaux (optionnels)
  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "",
  },

  // Configuration des inscriptions
  registration: {
    // Niveaux d'études disponibles
    studyLevels: [
      { value: "LICENCE", label: "Licence" },
      { value: "MASTER", label: "Master" },
      { value: "DOCTORAT", label: "Doctorat" },
    ] as const,

    // Étapes de validation
    validationSteps: [
      { step: 0, name: "Inscription", description: "Création du compte et soumission des informations" },
      { step: 1, name: "Vérification documents", description: "Validation des documents soumis" },
      { step: 2, name: "Validation académique", description: "Vérification par le département" },
      { step: 3, name: "Validation SGR", description: "Approbation finale par le SGR" },
    ],

    // Types de documents requis
    requiredDocuments: [
      { type: "diplome", label: "Diplôme ou attestation de réussite", required: true },
      { type: "releve_notes", label: "Relevé de notes", required: true },
      { type: "photo", label: "Photo d'identité", required: true },
      { type: "cni", label: "Carte d'identité ou passeport", required: true },
      { type: "lettre_motivation", label: "Lettre de motivation", required: false },
      { type: "cv", label: "Curriculum Vitae", required: false },
    ],
  },

  // Rôles disponibles pour les rendez-vous
  appointmentRoles: [
    { value: "SGR", label: "Secrétaire Général à la Recherche" },
    { value: "ASSISTANT_PRINCIPAL", label: "Assistant Principal" },
    { value: "DIRECTION_RECHERCHE", label: "Direction des Recherches" },
    { value: "DIRECTION_SUIVI", label: "Direction de Suivi et d'Encadrement" },
    { value: "SECRETARIAT", label: "Secrétariat" },
  ],

  // Paramètres de l'application
  settings: {
    itemsPerPage: 20,
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    allowedFileTypes: ["application/pdf", "image/jpeg", "image/png", "image/jpg"],
  },
} as const;

// Types dérivés de la configuration
export type StudyLevel = typeof APP_CONFIG.registration.studyLevels[number]["value"];
export type AppointmentRole = typeof APP_CONFIG.appointmentRoles[number]["value"];
