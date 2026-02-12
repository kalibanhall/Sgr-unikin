"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  DOCUMENT_CATEGORIES_DOCTORAT, 
  DOCUMENT_CATEGORIES_MASTER,
  MASTER_SUSPENSION_ALERT,
  DOCTORAT_INSCRIPTION_DOCS,
  DOCTORAT_SOUTENANCE_DOCS,
  MASTER_INSCRIPTION_DOCS,
  MASTER_SOUTENANCE_DOCS,
  CHECKLIST_PDFS
} from "@/lib/constants";
import { 
  Loader2,
  Save,
  CheckCircle,
  X,
  Eye,
  FileText,
  Trash2,
  User,
  AlertTriangle,
  Upload,
  FolderOpen,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { DocumentPreview } from "@/components/student/document-preview";

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  faculty: string;
  address: string;
  phone: string;
  studyLevel: string;
  photoUrl?: string;
  user?: { email: string };
}

interface DossierStatus {
  dossierStatus: string;
  submittedAt: string | null;
  draftExpiresAt: string | null;
  currentStep: number;
  isComplete: boolean;
  documentsCount: number;
}

type DocType = { type: string; label: string; required: boolean; accept: string };

// Composant carte d'upload avec design moderne
function DocumentUploadBox({
  docType,
  uploadedDoc,
  onUpload,
  onDelete,
  onPreview,
  uploading,
  canEdit,
}: {
  docType: DocType;
  uploadedDoc: Document | undefined;
  onUpload: (file: File, type: string) => void;
  onDelete: (id: string) => void;
  onPreview: (doc: Document) => void;
  uploading: string | null;
  canEdit: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file, docType.type);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const isImage = uploadedDoc?.mimeType?.startsWith("image/");
  const isPDF = uploadedDoc?.mimeType === "application/pdf";

  return (
    <div 
      className="relative group"
      onMouseEnter={() => uploadedDoc && setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <div 
        className={`
          relative flex flex-col items-center justify-center p-4 
          border-2 border-dashed rounded-2xl min-h-35
          transition-all duration-300 ease-out
          ${uploadedDoc 
            ? "border-emerald-400 bg-linear-to-br from-emerald-50 to-white shadow-sm" 
            : "border-slate-300 bg-white hover:border-slate-400 hover:shadow-md hover:scale-[1.02]"
          }
          ${uploading === docType.type ? "opacity-60 animate-pulse" : ""}
        `}
      >
        {/* Badge de succès */}
        {uploadedDoc && (
          <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-1 shadow-lg">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
        )}

        {/* Label du document */}
        <p className="text-sm font-medium text-slate-800 text-center mb-3 px-2 leading-snug">
          {docType.label}
          {docType.required && <span className="text-red-500 ml-1">*</span>}
        </p>

        {/* Input file caché */}
        <input
          ref={inputRef}
          type="file"
          accept={docType.accept}
          onChange={handleFileSelect}
          disabled={!canEdit || uploading === docType.type}
          className="hidden"
          id={`file-${docType.type}`}
        />

        {uploading === docType.type ? (
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Envoi en cours...</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <label
              htmlFor={`file-${docType.type}`}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg 
                border transition-all duration-200 cursor-pointer
                ${canEdit 
                  ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:scale-95" 
                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                }
              `}
            >
              <Upload className="h-3 w-3" />
              Sélect. fichiers
            </label>
            <span className="text-xs text-slate-500">
              {uploadedDoc ? "✓ Téléversé" : "Aucun fichier"}
            </span>
          </div>
        )}

        {/* Actions pour fichier uploadé */}
        {uploadedDoc && canEdit && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => onPreview(uploadedDoc)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Voir"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(uploadedDoc.id)}
              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Prévisualisation au survol */}
      {showPreview && uploadedDoc && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-3 p-3 bg-white rounded-xl shadow-2xl border border-slate-200 w-52">
          {isImage ? (
            <img src={uploadedDoc.url} alt={uploadedDoc.name} className="w-full h-36 object-contain rounded-lg bg-slate-50" />
          ) : isPDF ? (
            <div className="flex flex-col items-center justify-center h-36 bg-linear-to-br from-red-50 to-orange-50 rounded-lg">
              <FileText className="h-12 w-12 text-red-500 mb-2" />
              <span className="text-xs text-slate-600 font-medium">Document PDF</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-36 bg-slate-50 rounded-lg">
              <FileText className="h-12 w-12 text-slate-400 mb-2" />
              <span className="text-xs text-slate-500">Fichier</span>
            </div>
          )}
          <p className="text-xs text-slate-600 mt-2 text-center truncate font-medium">{uploadedDoc.name}</p>
        </div>
      )}
    </div>
  );
}

// Composant Header Profil
function ProfileHeader({ 
  profile, 
  photoDoc,
  onPhotoChange,
  uploading 
}: { 
  profile: StudentProfile | null; 
  photoDoc: Document | undefined;
  onPhotoChange: () => void;
  uploading: boolean;
}) {
  if (!profile) return null;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mb-8 relative overflow-hidden">
      {/* Gradient decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-blue-100/50 to-transparent rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-linear-to-tr from-amber-100/50 to-transparent rounded-full -ml-24 -mb-24" />
      
      <div className="relative">
        {/* Photo et nom */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4 group">
            <div className={`
              w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl
              bg-linear-to-br from-slate-100 to-slate-200 
              flex items-center justify-center
              ${uploading ? 'animate-pulse' : ''}
            `}>
              {photoDoc ? (
                <img src={photoDoc.url} alt="Photo de profil" className="w-full h-full object-cover" />
              ) : (
                <User className="h-14 w-14 text-slate-400" />
              )}
            </div>
            <button 
              onClick={onPhotoChange}
              disabled={uploading}
              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 
                px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full 
                shadow-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "..." : "Changer photo"}
            </button>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">
            {profile.firstName} {profile.lastName}
          </h2>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mt-2">
            {profile.studyLevel === "DOCTORAT" ? "Doctorat" : "Master / DEA / DES"}
          </span>
        </div>

        {/* Informations en grille */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Nom complet", value: `${profile.firstName} ${profile.lastName}` },
            { label: "Email", value: profile.user?.email || profile.email || "—" },
            { label: "Faculté", value: profile.faculty || "—" },
            { label: "Adresse", value: profile.address || "—" },
            { label: "Téléphone", value: profile.phone || "—" },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {item.label}
              </label>
              <div className="h-10 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-sm text-slate-800 truncate block">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Alerte suspension Master
function SuspensionAlert() {
  return (
    <div className="bg-linear-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6 mb-8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-red-800 mb-2">
            {MASTER_SUSPENSION_ALERT.title}
          </h3>
          <p className="text-sm text-red-700 leading-relaxed">
            {MASTER_SUSPENSION_ALERT.message}
          </p>
        </div>
      </div>
    </div>
  );
}

// Modal de prévisualisation
function PreviewModal({ document, onClose }: { document: Document | null; onClose: () => void }) {
  if (!document) return null;

  const isImage = document.mimeType?.startsWith("image/");
  const isPDF = document.mimeType === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900 truncate">{document.name}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)] bg-slate-100">
          {isImage ? (
            <img src={document.url} alt={document.name} className="max-w-full h-auto mx-auto rounded-lg shadow-lg" />
          ) : isPDF ? (
            <iframe src={document.url} className="w-full h-[70vh] rounded-lg" title={document.name} />
          ) : (
            <div className="text-center py-16">
              <FileText className="h-20 w-20 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Prévisualisation non disponible</p>
              <a href={document.url} target="_blank" rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                Télécharger le fichier
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Obtenir les documents par catégorie
function getDocsByCategory(categoryId: string): DocType[] {
  switch (categoryId) {
    case "inscription_these": return DOCTORAT_INSCRIPTION_DOCS;
    case "soutenance_these": return DOCTORAT_SOUTENANCE_DOCS;
    case "inscription_master": return MASTER_INSCRIPTION_DOCS;
    case "soutenance_master": return MASTER_SOUTENANCE_DOCS;
    default: return [];
  }
}

// Obtenir le lien de la checklist pour une catégorie
function getChecklistForCategory(categoryId: string, studyLevel: string): { label: string; url: string } | null {
  if (categoryId === "soutenance_these" && studyLevel === "DOCTORAT") {
    return CHECKLIST_PDFS.DOCTORAT.soutenance;
  }
  if (categoryId === "soutenance_master" && studyLevel === "MASTER") {
    return CHECKLIST_PDFS.MASTER.soutenance;
  }
  return null;
}

// Section de catégorie de documents
function DocumentCategory({
  category,
  documents,
  onUpload,
  onDelete,
  onPreview,
  uploading,
  canEdit,
  studyLevel,
}: {
  category: { id: string; title: string; color: string };
  documents: Document[];
  onUpload: (file: File, type: string) => void;
  onDelete: (id: string) => void;
  onPreview: (doc: Document) => void;
  uploading: string | null;
  canEdit: boolean;
  studyLevel: string;
}) {
  const categoryDocs = getDocsByCategory(category.id);
  const checklist = getChecklistForCategory(category.id, studyLevel);

  const colorClasses: Record<string, string> = {
    amber: "from-amber-500 to-orange-500",
    emerald: "from-emerald-500 to-teal-500",
    blue: "from-blue-500 to-indigo-500",
  };

  return (
    <div className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${colorClasses[category.color] || colorClasses.amber} flex items-center justify-center shadow-lg`}>
            <FolderOpen className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{category.title}</h2>
        </div>
        {checklist && (
          <a
            href={checklist.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl 
              bg-blue-50 text-blue-700 border border-blue-200 
              hover:bg-blue-100 hover:border-blue-300 transition-all duration-200
              shadow-sm hover:shadow"
          >
            <Download className="h-4 w-4" />
            {checklist.label}
          </a>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categoryDocs.map((docType) => {
          const uploadedDoc = documents.find(d => d.type === docType.type);
          return (
            <DocumentUploadBox
              key={docType.type}
              docType={docType}
              uploadedDoc={uploadedDoc}
              onUpload={onUpload}
              onDelete={onDelete}
              onPreview={onPreview}
              uploading={uploading}
              canEdit={canEdit}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [dossierStatus, setDossierStatus] = useState<DossierStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, dossierRes, profileRes] = await Promise.all([
          fetch("/api/student/documents"),
          fetch("/api/student/dossier"),
          fetch("/api/student/profile")
        ]);
        if (docsRes.ok) setDocuments(await docsRes.json());
        if (dossierRes.ok) setDossierStatus(await dossierRes.json());
        if (profileRes.ok) setProfile(await profileRes.json());
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    if (session?.user) fetchData();
  }, [session]);

  const handleUpload = async (file: File, type: string) => {
    setUploading(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/student/documents", { method: "POST", body: formData });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur d'upload");
      }

      const newDoc = await res.json();
      setDocuments(prev => {
        const filtered = prev.filter(d => d.type !== type);
        return [...filtered, newDoc];
      });
      toast.success("Document téléversé avec succès !");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur d'upload");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous supprimer ce document ?")) return;
    try {
      const res = await fetch(`/api/student/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur de suppression");
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast.success("Document supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUpload(file, "photo");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/student/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_draft" }),
      });
      if (!res.ok) throw new Error("Erreur d'enregistrement");
      const data = await res.json();
      setDossierStatus(data);
      toast.success("Brouillon enregistré (valide 7 jours)");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm("Voulez-vous soumettre votre dossier ? Cette action est définitive.")) return;
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/student/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur de soumission");
      }
      const data = await res.json();
      setDossierStatus(data);
      toast.success("Dossier soumis avec succès !");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const canEdit = !dossierStatus || dossierStatus.dossierStatus === "DRAFT";
  const isDoctorat = profile?.studyLevel === "DOCTORAT";
  const categories = isDoctorat ? DOCUMENT_CATEGORIES_DOCTORAT : DOCUMENT_CATEGORIES_MASTER;
  const photoDoc = documents.find(d => d.type === "photo");

  // Compter les documents requis
  const allDocs = isDoctorat 
    ? [...DOCTORAT_INSCRIPTION_DOCS, ...DOCTORAT_SOUTENANCE_DOCS]
    : [...MASTER_SOUTENANCE_DOCS];
  const requiredCount = allDocs.filter((d) => d.required).length;
  const uploadedRequiredCount = allDocs.filter((d) => 
    d.required && documents.some(doc => doc.type === d.type)
  ).length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Input caché pour la photo */}
        <input
          ref={photoInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        {/* Header Profil */}
        <ProfileHeader 
          profile={profile} 
          photoDoc={photoDoc}
          onPhotoChange={() => photoInputRef.current?.click()}
          uploading={uploading === "photo"}
        />

        {/* Bouton prévisualiser le dossier complet */}
        {documents.length > 0 && (
          <div className="flex justify-end mb-6">
            <Button
              onClick={() => setShowFullPreview(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Eye className="h-5 w-5" />
              Prévisualiser le dossier complet
            </Button>
          </div>
        )}

        {/* Alerte suspension pour Master */}
        {!isDoctorat && <SuspensionAlert />}

        {/* Catégories de documents */}
        {categories.map((category) => (
          <DocumentCategory
            key={category.id}
            category={category}
            documents={documents}
            onUpload={handleUpload}
            onDelete={handleDelete}
            onPreview={setPreviewDoc}
            uploading={uploading}
            canEdit={canEdit}
            studyLevel={profile?.studyLevel || ""}
          />
        ))}

        {/* Boutons d'action sticky */}
        <div className="sticky bottom-4 mt-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <Button
                onClick={handleSaveDraft}
                disabled={saving || !canEdit}
                className="flex-1 h-14 text-lg font-bold bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                Enregistrer
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={submitting || !canEdit}
                className="flex-1 h-14 text-lg font-bold bg-linear-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                Soumettre
              </Button>
            </div>

            {/* Compteur de progression */}
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-slate-700">
                  {uploadedRequiredCount}/{requiredCount} documents requis téléversés
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de prévisualisation individuelle */}
        <PreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />

        {/* Galerie de prévisualisation du dossier complet */}
        {showFullPreview && documents.length > 0 && (
          <DocumentPreview
            documents={documents}
            onClose={() => setShowFullPreview(false)}
          />
        )}
      </div>
    </div>
  );
}
