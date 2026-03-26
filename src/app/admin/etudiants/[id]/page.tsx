"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ValidationSteps } from "@/components/student/validation-steps";
import { DocumentPreview } from "@/components/student/document-preview";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  FileText,
  Download,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  Eye,
  MessageSquare,
  Shield,
  Clock,
  AlertTriangle,
  FolderOpen,
  Trash2
} from "lucide-react";
import { getStudyLevelLabel, formatDate } from "@/lib/utils";
import { 
  ADMIN_LEVELS,
  DOCUMENT_CATEGORIES_DOCTORAT,
  DOCUMENT_CATEGORIES_MASTER,
  DOCTORAT_INSCRIPTION_DOCS,
  DOCTORAT_SOUTENANCE_DOCS,
  MASTER_INSCRIPTION_DOCS,
  MASTER_SOUTENANCE_DOCS,
} from "@/lib/constants";

interface StudentDetail {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  nationality: string;
  gender: string | null;
  phone: string | null;
  address: string | null;
  faculty: string | null;
  department: string | null;
  studyLevel: string;
  specialization: string | null;
  thesisTitle: string | null;
  supervisor: string | null;
  coSupervisor: string | null;
  currentStep: number;
  maxSteps: number;
  isComplete: boolean;
  dossierStatus: string;
  dossierType?: string;
  submittedAt: string | null;
  createdAt: string;
  user: {
    email: string;
    createdAt: string;
  };
  documents: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
  }>;
  validations: Array<{
    step: number;
    status: string;
    comment: string | null;
    validatedAt: string | null;
    validatedBy: string | null;
  }>;
}

interface AdminReview {
  id: string;
  step: number;
  decision: string;
  comment: string | null;
  createdAt: string;
  admin: {
    name: string | null;
    email: string;
    role: string;
  };
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [comment, setComment] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [adminReviews, setAdminReviews] = useState<AdminReview[]>([]);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [technicalValidations, setTechnicalValidations] = useState<{
    count: number;
    requiredValidations: number;
    hasCurrentAdminValidated: boolean;
    isComplete: boolean;
  } | null>(null);
  
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const adminLevel = session?.user?.adminLevel || 1;
  const levelConfig = ADMIN_LEVELS.find(l => l.level === adminLevel);
  const canValidateCurrentStep = isSuperAdmin || (levelConfig?.allowedSteps?.includes(student?.currentStep ?? -1) ?? false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(`/api/admin/students/${resolvedParams.id}`);
        if (res.ok) {
          const data = await res.json();
          setStudent(data);
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/admin/reviews?studentId=${resolvedParams.id}`);
        if (res.ok) {
          const data = await res.json();
          setAdminReviews(data);
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    };

    const fetchTechnicalValidations = async () => {
      try {
        const res = await fetch(`/api/admin/students/${resolvedParams.id}/technical-validations?step=2`);
        if (res.ok) {
          const data = await res.json();
          setTechnicalValidations(data);
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    };

    if (session?.user) {
      fetchStudent();
      fetchReviews();
      fetchTechnicalValidations();
    }
  }, [session, resolvedParams.id]);

  const fetchAdminReviews = async () => {
    try {
      const res = await fetch(`/api/admin/reviews?studentId=${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setAdminReviews(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleSubmitReview = async (decision: string) => {
    if (!student) return;
    
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          step: student.currentStep,
          decision,
          comment: reviewComment,
        }),
      });

      if (res.ok) {
        setReviewComment("");
        fetchAdminReviews();
        alert("Avis enregistré avec succès");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleValidation = async (action: "approve" | "reject") => {
    if (!student) return;
    
    setValidating(true);
    try {
      const res = await fetch(`/api/admin/students/${student.id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: student.currentStep,
          status: action === "approve" ? "APPROVED" : "REJECTED",
          comment,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Check if this is a pending double validation
        if (data.pending) {
          alert(data.message);
          // Refresh technical validations count
          const techRes = await fetch(`/api/admin/students/${resolvedParams.id}/technical-validations?step=2`);
          if (techRes.ok) {
            setTechnicalValidations(await techRes.json());
          }
        } else {
          // Full validation completed - refresh student data
          const updatedRes = await fetch(`/api/admin/students/${resolvedParams.id}`);
          if (updatedRes.ok) {
            const updatedData = await updatedRes.json();
            setStudent(updatedData);
            setComment("");
          }
        }
      } else {
        alert(data.error || "Erreur lors de la validation");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setValidating(false);
    }
  };

  const handleCancelValidation = async (stepToCancel: number) => {
    if (!student) return;
    if (!confirm(`Voulez-vous vraiment annuler la validation de l'étape ${stepToCancel} ?`)) return;

    setCancelling(true);
    try {
      const res = await fetch(`/api/admin/students/${student.id}/validate?step=${stepToCancel}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        const updatedRes = await fetch(`/api/admin/students/${resolvedParams.id}`);
        if (updatedRes.ok) {
          setStudent(await updatedRes.json());
        }
      } else {
        alert(data.error || "Erreur lors de l'annulation");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (!student) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/etudiants");
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Determine if admin can cancel the previous step
  // L1 can cancel steps they validated if the next step hasn't been validated
  const previousStep = student ? student.currentStep - 1 : -1;
  const canCancelPreviousStep = student && !student.isComplete && previousStep >= 0 && (
    isSuperAdmin || (levelConfig?.allowedSteps?.includes(previousStep) ?? false)
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Candidat non trouvé</h2>
            <BackButton fallbackUrl="/admin/etudiants">Retour à la liste</BackButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton fallbackUrl="/admin/etudiants" variant="ghost" className="text-blue-600 hover:underline mb-4">
            Retour à la liste
          </BackButton>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-gray-900 mt-1">{student.user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              {isSuperAdmin && (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              )}
              <Button
                onClick={() => window.open(`/api/admin/students/${student.id}/download-pdf`, '_blank')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Télécharger le dossier PDF
              </Button>
              <Badge variant={student.isComplete ? "success" : "pending"} className="text-lg px-4 py-2">
                Étape {Math.min(student.currentStep, student.maxSteps - 1)}/{student.maxSteps - 1}
              </Badge>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>État du dossier</CardTitle>
          </CardHeader>
          <CardContent>
            <ValidationSteps currentStep={student.currentStep} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={User} label="Nom complet" value={`${student.firstName} ${student.lastName}`} />
              <InfoRow icon={Mail} label="Email" value={student.user.email} />
              <InfoRow icon={Phone} label="Téléphone" value={student.phone || "Non renseigné"} />
              <InfoRow icon={Calendar} label="Date de naissance" value={student.dateOfBirth ? formatDate(student.dateOfBirth) : "Non renseignée"} />
              <InfoRow icon={MapPin} label="Lieu de naissance" value={student.placeOfBirth || "Non renseigné"} />
              <InfoRow icon={User} label="Nationalité" value={student.nationality} />
              <InfoRow icon={MapPin} label="Adresse" value={student.address || "Non renseignée"} />
            </CardContent>
          </Card>

          {/* Informations académiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Informations académiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={GraduationCap} label="Niveau" value={getStudyLevelLabel(student.studyLevel)} />
              <InfoRow icon={GraduationCap} label="Faculté" value={student.faculty || "Non renseignée"} />
              <InfoRow icon={GraduationCap} label="Département" value={student.department || "Non renseigné"} />
              <InfoRow icon={GraduationCap} label="Spécialisation" value={student.specialization || "Non renseignée"} />
              <InfoRow icon={FileText} label="Titre de thèse" value={student.thesisTitle || "Non renseigné"} />
              <InfoRow icon={User} label="Directeur" value={student.supervisor || "Non renseigné"} />
              <InfoRow icon={User} label="Co-directeur" value={student.coSupervisor || "Non renseigné"} />
            </CardContent>
          </Card>
        </div>

        {/* Documents */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents ({student.documents.length})
            </CardTitle>
            {student.documents.length > 0 && (
              <Button onClick={() => setShowPreview(true)} variant="default">
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser le dossier complet
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {(() => {
              const isDoctorat = student.studyLevel === "DOCTORAT";
              const dossierType = student.dossierType || "INSCRIPTION";
              const allCategories = isDoctorat ? DOCUMENT_CATEGORIES_DOCTORAT : DOCUMENT_CATEGORIES_MASTER;
              const filteredCategories = allCategories.filter((cat) => {
                if (dossierType === "INSCRIPTION") return cat.id.includes("inscription");
                if (dossierType === "SOUTENANCE") return cat.id.includes("soutenance");
                return true;
              });
              const categories = filteredCategories.length > 0 ? filteredCategories : allCategories;

              const getDocsByCategory = (categoryId: string) => {
                switch (categoryId) {
                  case "inscription_these": return DOCTORAT_INSCRIPTION_DOCS;
                  case "soutenance_these": return DOCTORAT_SOUTENANCE_DOCS;
                  case "inscription_master": return MASTER_INSCRIPTION_DOCS;
                  case "soutenance_master": return MASTER_SOUTENANCE_DOCS;
                  default: return [];
                }
              };

              const colorClasses: Record<string, string> = {
                amber: "from-amber-500 to-orange-500",
                emerald: "from-emerald-500 to-teal-500",
                blue: "from-blue-500 to-indigo-500",
              };

              return categories.map((category) => {
                const categoryDocs = getDocsByCategory(category.id);
                const uploadedCount = categoryDocs.filter((d) => student.documents.some((doc) => doc.type === d.type)).length;
                const requiredCount = categoryDocs.filter((d) => d.required).length;
                const missingRequired = categoryDocs.filter((d) => d.required && !student.documents.some((doc) => doc.type === d.type));

                return (
                  <div key={category.id} className="mb-8 last:mb-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${colorClasses[category.color] || colorClasses.amber} flex items-center justify-center shadow`}>
                        <FolderOpen className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900">{category.title}</h3>
                      <span className="text-sm text-gray-500">
                        {uploadedCount}/{categoryDocs.length} téléversés
                      </span>
                    </div>

                    {missingRequired.length > 0 && (
                      <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            {missingRequired.length} document(s) obligatoire(s) manquant(s)
                          </p>
                          <ul className="mt-1 text-xs text-red-700 space-y-0.5">
                            {missingRequired.map((d) => (
                              <li key={d.type}>- {d.label}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryDocs.map((docType) => {
                        const uploadedDoc = student.documents.find((d) => d.type === docType.type);
                        return (
                          <div
                            key={docType.type}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              uploadedDoc
                                ? "bg-emerald-50 border-emerald-200"
                                : docType.required
                                ? "bg-red-50 border-red-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {uploadedDoc ? (
                                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                              ) : docType.required ? (
                                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                              ) : (
                                <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className={`text-sm font-medium truncate ${uploadedDoc ? "text-gray-900" : docType.required ? "text-red-800" : "text-gray-600"}`}>
                                  {docType.label}
                                </p>
                                {uploadedDoc && (
                                  <p className="text-xs text-gray-500">
                                    {(uploadedDoc.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                )}
                              </div>
                            </div>
                            {uploadedDoc ? (
                              <Button size="sm" variant="outline" asChild className="shrink-0 ml-2">
                                <a href={uploadedDoc.url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            ) : (
                              <span className={`text-xs font-medium shrink-0 ml-2 ${docType.required ? "text-red-600" : "text-gray-400"}`}>
                                {docType.required ? "Manquant" : "Optionnel"}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </CardContent>
        </Card>

        {/* Historique des validations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Historique des validations</CardTitle>
          </CardHeader>
          <CardContent>
            {student.validations.length === 0 ? (
              <p className="text-gray-700 text-center py-4">Aucune validation enregistrée</p>
            ) : (
              <div className="space-y-4">
                {student.validations.map((validation) => (
                  <div
                    key={validation.step}
                    className={`p-4 rounded-lg border ${
                      validation.status === "APPROVED"
                        ? "bg-green-50 border-green-200"
                        : validation.status === "REJECTED"
                        ? "bg-red-50 border-red-200"
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {validation.status === "APPROVED" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : validation.status === "REJECTED" ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Loader2 className="h-5 w-5 text-yellow-600" />
                        )}
                        <span className="font-medium">Étape {validation.step}</span>
                        {validation.validatedBy && (
                          <span className="text-sm text-gray-600 ml-2">
                            par <span className="font-medium">{validation.validatedBy}</span>
                          </span>
                        )}
                      </div>
                      {validation.validatedAt && (
                        <span className="text-sm text-gray-500">
                          {formatDate(validation.validatedAt)}
                        </span>
                      )}
                    </div>
                    {validation.comment && (
                      <p className="mt-2 text-sm text-gray-700">{validation.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions de validation */}
        {!student.isComplete && canValidateCurrentStep && (
          <Card className="mt-8 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Actions de validation</CardTitle>
              <CardDescription className="text-gray-700">
                Validez ou rejetez l&apos;étape {student.currentStep} du dossier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Technical validation info for step 2 */}
              {student.currentStep === 2 && technicalValidations && (
                <div className={`p-4 rounded-lg border ${
                  technicalValidations.hasCurrentAdminValidated
                    ? "bg-green-50 border-green-200"
                    : technicalValidations.count > 0
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-blue-50 border-blue-200"
                }`}>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Validation technique - Double validation requise
                      </p>
                      <p className="text-sm text-gray-700">
                        {technicalValidations.hasCurrentAdminValidated
                          ? "Vous avez déjà validé cette étape technique."
                          : `${technicalValidations.count}/${technicalValidations.requiredValidations} validation(s) technique(s) enregistrée(s).`
                        }
                        {!technicalValidations.hasCurrentAdminValidated && technicalValidations.count > 0 && (
                          <span className="ml-1 text-green-600 font-medium">
                            (Une première validation a été effectuée)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Commentaire (optionnel)</label>
                <Textarea
                  placeholder="Ajoutez un commentaire pour le candidat..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="text-gray-900"
                />
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => handleValidation("approve")}
                  disabled={validating || (student.currentStep === 2 && technicalValidations?.hasCurrentAdminValidated)}
                  className="flex-1"
                  variant="default"
                >
                  {validating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {student.currentStep === 2 
                    ? (technicalValidations?.hasCurrentAdminValidated 
                        ? "Déjà validé" 
                        : `Valider (${(technicalValidations?.count || 0) + 1}/${technicalValidations?.requiredValidations || 2})`)
                    : `Valider l'étape ${student.currentStep}`
                  }
                </Button>
                <Button
                  onClick={() => handleValidation("reject")}
                  disabled={validating || (student.currentStep === 2 && technicalValidations?.hasCurrentAdminValidated)}
                  className="flex-1"
                  variant="destructive"
                >
                  {validating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Rejeter
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message si l'admin n'a pas le droit de valider cette étape */}
        {!student.isComplete && !canValidateCurrentStep && (
          <Card className="mt-8 border-2 border-gray-200 bg-gray-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-gray-600">
                <Shield className="h-5 w-5" />
                <div>
                  <p className="font-medium">Vous ne pouvez pas valider cette étape</p>
                  <p className="text-sm">Votre niveau ({levelConfig?.shortLabel || `Niveau ${adminLevel}`}) permet d&apos;intervenir sur les étapes : {levelConfig?.allowedSteps?.join(", ") || "aucune"}. L&apos;étape actuelle est {student.currentStep}.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Annuler la validation précédente */}
        {canCancelPreviousStep && (
          <Card className="mt-8 border-2 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Annuler la validation de l&apos;étape {previousStep}</p>
                    <p className="text-sm text-orange-700">Remettre le dossier à l&apos;étape {previousStep} (avant validation)</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleCancelValidation(previousStep)}
                  disabled={cancelling}
                  variant="outline"
                  className="border-orange-500 text-orange-700 hover:bg-orange-100"
                >
                  {cancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Annuler la validation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Émettre un avis (pour les admins) */}
        <Card className="mt-8 border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <MessageSquare className="h-5 w-5" />
              Émettre un avis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Votre avis sur ce dossier</label>
              <Textarea
                placeholder="Décrivez votre avis sur ce dossier d'inscription..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="text-gray-900"
              />
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => handleSubmitReview("FAVORABLE")}
                disabled={submittingReview || !reviewComment.trim()}
                variant="outline"
                className="flex-1 border-green-500 text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Avis favorable
              </Button>
              <Button
                onClick={() => handleSubmitReview("RESERVE")}
                disabled={submittingReview || !reviewComment.trim()}
                variant="outline"
                className="flex-1 border-orange-500 text-orange-700 hover:bg-orange-50"
              >
                <Clock className="h-4 w-4 mr-2" />
                Avec réserve
              </Button>
              <Button
                onClick={() => handleSubmitReview("DEFAVORABLE")}
                disabled={submittingReview || !reviewComment.trim()}
                variant="outline"
                className="flex-1 border-red-500 text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Avis défavorable
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Avis des administrateurs - visible uniquement pour Super Admin */}
        {isSuperAdmin && adminReviews.length > 0 && (
          <Card className="mt-8 border-2 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Shield className="h-5 w-5" />
                Avis des administrateurs ({adminReviews.length})
              </CardTitle>
              <CardDescription className="text-gray-700">
                Vue d&apos;ensemble des avis émis par tous les administrateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adminReviews.map((review) => (
                  <div
                    key={review.id}
                    className={`p-4 rounded-lg border ${
                      review.decision === "FAVORABLE"
                        ? "bg-green-50 border-green-200"
                        : review.decision === "DEFAVORABLE"
                        ? "bg-red-50 border-red-200"
                        : "bg-orange-50 border-orange-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-700" />
                        <span className="font-medium text-gray-900">
                          {review.admin.name || review.admin.email}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {review.admin.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-700">{formatDate(review.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={
                          review.decision === "FAVORABLE"
                            ? "success"
                            : review.decision === "DEFAVORABLE"
                            ? "destructive"
                            : "pending"
                        }
                      >
                        {review.decision === "FAVORABLE"
                          ? "Avis favorable"
                          : review.decision === "DEFAVORABLE"
                          ? "Avis défavorable"
                          : "Avec réserve"}
                      </Badge>
                      <span className="text-sm text-gray-700">• Étape {review.step}</span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-900 mt-2 bg-white/50 p-3 rounded">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Confirmer la suppression
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Êtes-vous sûr de vouloir supprimer le dossier de <strong>{student.firstName} {student.lastName}</strong> ?
                Cette action est irréversible et supprimera toutes les données associées.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Supprimer définitivement
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de prévisualisation des documents */}
      {showPreview && student.documents.length > 0 && (
        <DocumentPreview
          documents={student.documents}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
