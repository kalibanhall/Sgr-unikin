export const FACULTIES = [
  { code: "DROIT", name: "Faculté de Droit" },
  { code: "MEDECINE", name: "Faculté de Médecine" },
  { code: "PHARMA", name: "Faculté des Sciences Pharmaceutiques" },
  { code: "POLYTECH", name: "Faculté Polytechnique" },
  { code: "SCIENCES", name: "Faculté des Sciences" },
  { code: "LETTRES", name: "Faculté des Lettres et Sciences Humaines" },
  { code: "PSYCHO", name: "Faculté de Psychologie et Sciences de l'Éducation" },
  { code: "ECOGEST", name: "Faculté des Sciences Économiques et de Gestion" },
  { code: "SOCIO", name: "Faculté des Sciences Sociales, Administratives et Politiques" },
  { code: "AGRO", name: "Faculté des Sciences Agronomiques" },
  { code: "PETRO", name: "Faculté du Pétrole, Gaz et Énergies Renouvelables" },
  { code: "VETERINAIRE", name: "Faculté de Médecine Vétérinaire" },
  { code: "ODONTO", name: "Faculté d'Odontostomatologie" },
];

// Types d'inscription/demande disponibles
export const REGISTRATION_TYPES = [
  { 
    value: "INSCRIPTION_THESE", 
    label: "Inscription en Thèse de Doctorat", 
    shortLabel: "Inscription Thèse",
    description: "Pour s'inscrire au programme de Doctorat (PhD)",
    studyLevel: "DOCTORAT",
    category: "inscription",
    color: "blue",
    icon: "🎓"
  },
  { 
    value: "SOUTENANCE_THESE", 
    label: "Demande de Soutenance de Thèse", 
    shortLabel: "Soutenance Thèse",
    description: "Pour solliciter la soutenance de votre thèse de Doctorat",
    studyLevel: "DOCTORAT",
    category: "soutenance",
    color: "emerald",
    icon: "🏆"
  },
  { 
    value: "INSCRIPTION_MASTER", 
    label: "Inscription en Master/DES/DEA", 
    shortLabel: "Inscription Master",
    description: "Pour s'inscrire au programme de Master (DES/DEA)",
    studyLevel: "MASTER",
    category: "inscription",
    suspended: true, // Inscriptions suspendues
    color: "violet",
    icon: "📜"
  },
  { 
    value: "SOUTENANCE_MASTER", 
    label: "Demande de Soutenance de Master", 
    shortLabel: "Soutenance Master",
    description: "Pour solliciter la soutenance de votre mémoire de Master",
    studyLevel: "MASTER",
    category: "soutenance",
    color: "amber",
    icon: "✍️"
  },
];

// Anciens niveaux d'études (pour compatibilité)
export const STUDY_LEVELS = [
  { value: "MASTER", label: "Master / DEA / DES" },
  { value: "DOCTORAT", label: "Doctorat (PhD)" },
];

export const VALIDATION_STEPS = [
  { step: 0, title: "Inscription initiale", description: "Création du compte et informations de base" },
  { step: 1, title: "Documents requis", description: "Téléversement des documents académiques et administratifs" },
  { step: 2, title: "Validation académique", description: "Vérification par le service académique" },
  { step: 3, title: "Validation administrative", description: "Validation finale par l'administration" },
  { step: 4, title: "Inscription complète", description: "Dossier validé et inscription finalisée" },
];

// ============================================
// DOCUMENTS POUR DOCTORAT
// ============================================

export const DOCTORAT_INSCRIPTION_DOCS = [
  { type: "doc_lettre_demande_inscription", label: "Lettre de demande d'inscription adressée au SGR par la Faculté", required: true, accept: ".pdf" },
  { type: "doc_pv_approbation_comite", label: "PV d'approbation du Comité d'encadrement par le Conseil de Faculté", required: true, accept: ".pdf" },
  { type: "doc_pv_constitution_comite", label: "PV de constitution du comité d'encadrement par le Conseil de Département", required: true, accept: ".pdf" },
  { type: "doc_lettre_demande_chef_dept", label: "Lettre de demande adressée au chef de Département par le candidat", required: true, accept: ".pdf" },
  { type: "doc_lettre_demande_direction", label: "Lettre de demande de direction adressée au Promoteur par le candidat", required: true, accept: ".pdf" },
  { type: "doc_lettre_acceptation_promoteur", label: "Lettre d'acceptation du Promoteur adressée au candidat", required: true, accept: ".pdf" },
  { type: "doc_cv", label: "Curriculum vitae du candidat", required: true, accept: ".pdf" },
  { type: "doc_preuve_paiement", label: "Preuves de payement frais d'analyse du dossier", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "doc_projet_recherche", label: "Copie de projet de recherche", required: true, accept: ".pdf" },
  { type: "doc_acte_nomination", label: "Acte de nomination, si personnel Scientifique d'une institution de l'ESU", required: false, accept: ".pdf" },
  { type: "doc_diplome_des_dea", label: "Copie certifiée conforme de diplôme de DES/DEA", required: true, accept: ".pdf" },
  { type: "doc_releve_des_dea", label: "Relevé des côtes de DES/DEA avec au moins 70%", required: true, accept: ".pdf" },
  { type: "doc_diplome_licence", label: "Copie certifiée conforme de diplôme de Licence", required: true, accept: ".pdf" },
  { type: "doc_diplome_graduat", label: "Copie certifiée conforme de diplôme de graduat", required: true, accept: ".pdf" },
  { type: "doc_releve_cycles", label: "Les relevés des côtes du 1er et 2ème cycle", required: true, accept: ".pdf" },
  { type: "doc_casier_judiciaire", label: "Extrait du casier judiciaire", required: true, accept: ".pdf" },
  { type: "doc_piece_identite", label: "Copie de la pièce identité", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "doc_attestation_bonne_vie", label: "Attestations de bonne vie et mœurs", required: true, accept: ".pdf" },
  { type: "doc_attestation_nationalite", label: "Attestation de nationalité", required: true, accept: ".pdf" },
];

export const DOCTORAT_SOUTENANCE_DOCS = [
  { type: "sout_lettre_transmission", label: "Lettre de transmission du dossier adressée au SGR par le Doyen", required: true, accept: ".pdf" },
  { type: "sout_notification_inscription", label: "La notification ou la décision rectorale de l'inscription en thèse", required: true, accept: ".pdf" },
  { type: "sout_pv_approbation_jury", label: "PV d'approbation du jury de thèse par le Conseil de Faculté", required: true, accept: ".pdf" },
  { type: "sout_pv_constitution_jury", label: "PV de constitution du jury validé par le Conseil de Département", required: true, accept: ".pdf" },
  { type: "sout_pv_approbation_comite", label: "PV d'approbation du comité d'encadrement par la Faculté", required: true, accept: ".pdf" },
  { type: "sout_pv_constitution_comite", label: "PV de constitution du comité d'encadrement par le Conseil de Département", required: true, accept: ".pdf" },
  { type: "sout_avis_favorable", label: "Avis favorable d'autorisation du dépôt du travail par les Membres du Comité d'encadrement", required: true, accept: ".pdf" },
  { type: "sout_lettre_proposition_jury", label: "Lettre de proposition du jury et transmission du dossier par le Promoteur", required: true, accept: ".pdf" },
  { type: "sout_bordereaux_paiement", label: "Les bordereaux de paiement des frais académiques (3 ans au minimum)", required: true, accept: ".pdf" },
  { type: "sout_publications", label: "2 publications dont une dans une revue indexée du domaine de recherche", required: true, accept: ".pdf" },
  { type: "sout_dissertation_volumes", label: "Deux volumes de dissertation avec synthèse français, anglais et langue nationale", required: true, accept: ".pdf" },
  { type: "sout_paiement_antiplagiat", label: "Bordereau de payement d'analyse anti plagiat", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "sout_certificat_antiplagiat", label: "Certificat d'analyse anti plagiat (maximum 15% de similitude)", required: true, accept: ".pdf" },
  { type: "sout_arrete_ministeriel", label: "Le dernier arrêté ministériel promotion (P, PO, PE) de chaque membre du jury", required: true, accept: ".pdf" },
  { type: "sout_specialite_jury", label: "Indication de la spécialité et l'établissement d'origine de chaque membre du jury", required: true, accept: ".pdf" },
  { type: "sout_pv_seminaires", label: "Procès-verbaux annuels du comité d'encadrement sur l'avancement de la recherche (séminaires/exposés)", required: true, accept: ".pdf" },
  { type: "sout_cv", label: "Curriculum vitae du candidat", required: true, accept: ".pdf" },
  { type: "sout_diplome_des_dea", label: "Copie certifiée conforme de diplôme de DES/DEA", required: true, accept: ".pdf" },
  { type: "sout_releve_des_dea", label: "Relevé des côtes de DES/DEA (au moins 70%)", required: true, accept: ".pdf" },
  { type: "sout_acte_nomination", label: "Acte de nomination du personnel Scientifique de l'Université de Kinshasa", required: false, accept: ".pdf" },
  { type: "sout_diplome_licence", label: "Copie certifiée conforme de diplôme de Licence", required: true, accept: ".pdf" },
  { type: "sout_diplome_graduat", label: "Copie certifiée conforme de diplôme de graduat", required: true, accept: ".pdf" },
  { type: "sout_releve_cycles", label: "Les relevés des côtes du 1er et 2ème cycle", required: true, accept: ".pdf" },
  { type: "sout_piece_identite", label: "Copie de la pièce identité", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "sout_casier_judiciaire", label: "Extrait du casier judiciaire", required: true, accept: ".pdf" },
  { type: "sout_attestation_naissance", label: "Attestation de naissance", required: true, accept: ".pdf" },
  { type: "sout_attestation_bonne_vie", label: "Attestations de bonne vie et mœurs", required: true, accept: ".pdf" },
  { type: "sout_certificat_nationalite", label: "Certificat de nationalité / Passeport", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
];

// ============================================
// DOCUMENTS POUR MASTER/DEA/DES
// ============================================

export const MASTER_INSCRIPTION_DOCS = [
  { type: "mas_lettre_transmission", label: "Lettre de transmission du dossier adressée au SGR par le décanat", required: true, accept: ".pdf" },
  { type: "mas_notification_inscription", label: "Notification ou la décision rectorale d'inscription au DES/DEA", required: true, accept: ".pdf" },
  { type: "mas_pv_adoption_projet", label: "PV de la réunion d'adoption du projet du mémoire et d'approbation du comité d'encadrement par le conseil de Faculté", required: true, accept: ".pdf" },
  { type: "mas_pv_presentation_projet", label: "PV de la presentation du projet et constitution du comité d'encadrement par le Département", required: true, accept: ".pdf" },
  { type: "mas_avis_favorable", label: "Avis favorable d'autorisation du dépôt du travail par les Membres du Comité d'encadrement adressée", required: true, accept: ".pdf" },
  { type: "mas_lettre_transmission_promoteur", label: "Lettre de transmission du dossier par le Promoteur, adressée au Chef de Département", required: true, accept: ".pdf" },
  { type: "mas_bordereaux_paiement", label: "Les bordereaux de paiement des frais académique", required: true, accept: ".pdf" },
  { type: "mas_preuve_analyse", label: "Preuves de payement frais d'analyse du dossier", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "mas_publication", label: "Au moins une publication dans une Revue indexée du domaine de recherche en rapport avec le travail", required: true, accept: ".pdf" },
  { type: "mas_dissertation_volumes", label: "Deux volumes de dissertation avec synthèse en français, anglais et une des langues nationales", required: true, accept: ".pdf" },
  { type: "mas_paiement_antiplagiat", label: "Bordereau de paiement de frais pour analyse anti plagiat", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "mas_certificat_antiplagiat", label: "Certificat d'analyse anti plagiat (maximum 15% de similitude)", required: true, accept: ".pdf" },
  { type: "mas_arrete_ministeriel", label: "Le dernier arrêté ministériel de nomination de chaque membre du jury", required: true, accept: ".pdf" },
  { type: "mas_specialite_jury", label: "Indication de la spécialité de chaque membre avec un maximum de 2 Membres du même Département dans le Jury", required: true, accept: ".pdf" },
  { type: "mas_pv_seminaires", label: "Procès-verbaux des séminaires (exposés) sur l'avancement de la recherche", required: true, accept: ".pdf" },
  { type: "mas_cv", label: "Curriculum vitae", required: true, accept: ".pdf" },
  { type: "mas_piece_identite", label: "Copie de la pièce identité", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "mas_releve_cycles", label: "Les relevés des côtes du 1er et 2ème cycle", required: true, accept: ".pdf" },
  { type: "mas_diplome_licence", label: "Copie certifiée conforme de diplôme de Licence", required: true, accept: ".pdf" },
  { type: "mas_attestation_nationalite", label: "Attestation de nationalité", required: true, accept: ".pdf" },
  { type: "mas_attestation_bonne_vie", label: "Attestations de bonne vie et mœurs", required: true, accept: ".pdf" },
];

export const MASTER_SOUTENANCE_DOCS = [
  { type: "mas_sout_lettre_transmission", label: "Lettre de transmission du dossier adressée au SGR par le décanat", required: true, accept: ".pdf" },
  { type: "mas_sout_notification", label: "Notification ou décision rectorale d'inscription au DES/DEA", required: true, accept: ".pdf" },
  { type: "mas_sout_pv_adoption", label: "PV de la réunion d'adoption du projet et d'approbation du comité d'encadrement par le conseil de Faculté", required: true, accept: ".pdf" },
  { type: "mas_sout_pv_presentation", label: "PV de la presentation du projet et constitution du comité d'encadrement par le Département", required: true, accept: ".pdf" },
  { type: "mas_sout_avis_favorable", label: "Avis favorable d'autorisation du dépôt du travail par les Membres du Comité d'encadrement", required: true, accept: ".pdf" },
  { type: "mas_sout_lettre_promoteur", label: "Lettre de transmission du dossier par le Promoteur, adressée au Chef de Département", required: true, accept: ".pdf" },
  { type: "mas_sout_bordereaux", label: "Les bordereaux de paiement des frais académiques", required: true, accept: ".pdf" },
  { type: "mas_sout_preuve_analyse", label: "Preuves de payement frais d'analyse du dossier", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "mas_sout_publication", label: "Au moins une publication dans une Revue indexée du domaine de recherche", required: true, accept: ".pdf" },
  { type: "mas_sout_dissertation", label: "Deux volumes de dissertation avec synthèse en français, anglais et langue nationale", required: true, accept: ".pdf" },
  { type: "mas_sout_paiement_antiplagiat", label: "Bordereau de paiement de frais pour analyse anti plagiat", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "mas_sout_certificat_antiplagiat", label: "Certificat d'analyse anti plagiat (maximum 15% de similitude)", required: true, accept: ".pdf" },
  { type: "mas_sout_arrete_ministeriel", label: "Le dernier arrêté ministériel de nomination de chaque membre du jury", required: true, accept: ".pdf" },
  { type: "mas_sout_specialite_jury", label: "Indication de la spécialité de chaque membre avec max 2 du même Département dans le Jury", required: true, accept: ".pdf" },
  { type: "mas_sout_pv_seminaires", label: "Procès-verbaux des séminaires (exposés) sur l'avancement de la recherche", required: true, accept: ".pdf" },
  { type: "mas_sout_cv", label: "Curriculum vitae", required: true, accept: ".pdf" },
  { type: "mas_sout_piece_identite", label: "Copie de la pièce identité", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { type: "mas_sout_releve_cycles", label: "Les relevés des côtes du 1er et 2ème cycle", required: true, accept: ".pdf" },
  { type: "mas_sout_diplome_licence", label: "Copie certifiée conforme de diplôme de Licence", required: true, accept: ".pdf" },
  { type: "mas_sout_attestation_nationalite", label: "Attestation de nationalité", required: true, accept: ".pdf" },
  { type: "mas_sout_attestation_bonne_vie", label: "Attestations de bonne vie et mœurs", required: true, accept: ".pdf" },
];

// Photo commune
export const PHOTO_DOC = { type: "photo", label: "Photo d'identité récente (format passeport)", required: true, accept: ".jpg,.jpeg,.png" };

// Catégories par niveau d'études
export const DOCUMENT_CATEGORIES_DOCTORAT = [
  {
    id: "inscription_these",
    title: "INSCRIPTION À LA THÈSE",
    icon: "📁",
    color: "amber",
    documents: DOCTORAT_INSCRIPTION_DOCS,
  },
  {
    id: "soutenance_these",
    title: "SOUTENANCE DE LA THÈSE",
    icon: "📁",
    color: "emerald",
    documents: DOCTORAT_SOUTENANCE_DOCS,
  },
];

export const DOCUMENT_CATEGORIES_MASTER = [
  {
    id: "inscription_master",
    title: "SOUTENANCE MASTER/ED",
    icon: "📁",
    color: "amber",
    suspended: false,
    documents: MASTER_INSCRIPTION_DOCS,
  },
];

// Alerte pour Master
export const MASTER_SUSPENSION_ALERT = {
  title: "Les inscriptions en DEA/DES (Master) sont suspendu",
  message: `Les inscriptions en DEA/DES (Master) sont suspendu à l'université de Kinshasa conformément à l'article 30 de l'Arrêté ministériel n° 101/MINESU/CABMIN/MNB/BLB/2023 du 13 février 2023 modifiant et complétant l'Arrêté ministériel n° 175/MINESU/CABMIN/TMF/EBK-RK3 du 22/12/2015 portant normes d'opérationnalisation des enseignements du 3ème Cycle dans les établissements d'Enseignement Supérieur et Universitaire en République Démocratique du Congo, les inscriptions au DEA/DES ayant été arrêtées depuis l'année académique 2022-2023.`,
};

// Liste plate pour compatibilité
export const REQUIRED_DOCUMENTS = [
  ...DOCTORAT_INSCRIPTION_DOCS,
  ...DOCTORAT_SOUTENANCE_DOCS,
  ...MASTER_INSCRIPTION_DOCS,
  ...MASTER_SOUTENANCE_DOCS,
  PHOTO_DOC,
];

export const APPOINTMENT_TARGETS = [
  { value: "sgr", label: "Secrétaire Général à la Recherche" },
  { value: "assistant", label: "Assistant Principal du SGR" },
  { value: "oipr", label: "Chargé de l'OIPR" },
  { value: "projet", label: "Chargé de Projet" },
];
