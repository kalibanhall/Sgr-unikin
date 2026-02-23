"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ValidationSteps } from "@/components/student/validation-steps";
import { 
  FileText, 
  Upload, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Printer,
  PlusCircle
} from "lucide-react";
import Link from "next/link";
import { getStudyLevelLabel, formatDate } from "@/lib/utils";

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  faculty: string;
  department: string;
  studyLevel: string;
  currentStep: number;
  maxSteps: number;
  isComplete: boolean;
  dossierStatus: string;
  dossierType: string;
  submittedAt: string | null;
  createdAt: string;
  user: {
    email: string;
    createdAt: string;
  };
  documents: Array<{ id: string }>;
  validations: Array<{
    step: number;
    status: string;
    comment: string;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [creatingRequest, setCreatingRequest] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Rediriger les admins vers leur dashboard
      if (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN") {
        router.push("/admin");
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/student/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Profil non trouvé</h2>
            <p className="text-gray-900">
              Impossible de charger votre profil. Veuillez vous reconnecter.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = () => {
    const typeLabel = getDossierTypeLabel(profile.dossierType || 'INSCRIPTION');
    if (profile.isComplete) {
      return <Badge variant="success" className="text-base px-4 py-1.5 font-semibold">{typeLabel} complète</Badge>;
    }
    const lastValidation = profile.validations[profile.validations.length - 1];
    if (lastValidation?.status === "REJECTED") {
      return <Badge variant="destructive" className="text-base px-4 py-1.5 font-semibold">Action requise</Badge>;
    }
    if (profile.dossierStatus === "SUBMITTED" || profile.validations.length > 0) {
      return (
        <Badge className="bg-amber-500 text-white text-base px-4 py-2 font-bold shadow-md border-2 border-amber-600">
          En cours de validation
        </Badge>
      );
    }
    return <Badge variant="secondary" className="text-base px-4 py-1.5 font-semibold">Brouillon</Badge>;
  };

  const handleNewRequest = async (requestType: 'SOUTENANCE' | 'AUTRE') => {
    setCreatingRequest(true);
    try {
      const res = await fetch('/api/student/new-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Refresh the page to show new dossier state
        window.location.reload();
      } else {
        alert(data.error || 'Erreur lors de la création de la demande');
      }
    } catch (error) {
      console.error('Error creating new request:', error);
      alert('Erreur lors de la création de la demande');
    } finally {
      setCreatingRequest(false);
      setShowNewRequestModal(false);
    }
  };

  const getDossierTypeLabel = (type: string) => {
    switch (type) {
      case 'INSCRIPTION': return 'Inscription';
      case 'SOUTENANCE': return 'Soutenance';
      case 'AUTRE': return 'Autre demande';
      default: return type;
    }
  };

  const quickActions = [
    {
      href: "/dashboard/documents",
      icon: Upload,
      title: "Mes documents",
      description: `${profile.documents.length} document(s) téléversé(s)`,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      href: "/dashboard/profil",
      icon: User,
      title: "Mon profil",
      description: "Modifier mes informations",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      href: "/dashboard/rendez-vous",
      icon: Calendar,
      title: "Rendez-vous",
      description: "Prendre un rendez-vous",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenue{profile.firstName || profile.lastName ? `, ${profile.firstName || ""} ${profile.lastName || ""}` : " !"}
          </h1>
          <p className="text-gray-900 mt-1">
            {profile.dossierType === 'SOUTENANCE' ? 
              "Gérez votre demande de soutenance" :
              profile.dossierType === 'AUTRE' ?
                "Gérez votre demande administrative" :
                "Gérez votre dossier d'inscription au troisième cycle"
            }
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>État de votre dossier {profile.dossierType && profile.dossierType !== 'INSCRIPTION' ? `(${getDossierTypeLabel(profile.dossierType)})` : ''}</CardTitle>
                <CardDescription>
                  Inscrit depuis {formatDate(profile.createdAt)}
                </CardDescription>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            <ValidationSteps currentStep={profile.currentStep} />
            
            {/* Message selon l'étape */}
            <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              {profile.isComplete ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-green-800">Félicitations !</p>
                      <p className="text-green-700 text-sm">
                        Votre dossier de {getDossierTypeLabel(profile.dossierType || 'INSCRIPTION').toLowerCase()} est validé.
                      </p>
                    </div>
                    <a
                      href="/api/student/dossier/certificate"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shrink-0"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimer le certificat
                    </a>
                  </div>
                  
                  {/* Nouvelle demande section */}
                  <div className="pt-4 border-t border-green-200">
                    <p className="text-green-700 text-sm mb-3">
                      Vous pouvez maintenant soumettre une nouvelle demande (ex: soutenance de thèse).
                    </p>
                    <button
                      onClick={() => setShowNewRequestModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Nouvelle demande
                    </button>
                  </div>
                </div>
              ) : (profile.dossierStatus === "VALIDATED" || profile.dossierStatus === "COMPLETED") ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">Dossier validé !</p>
                    <p className="text-green-700 text-sm">
                      Votre dossier a été validé. Imprimez votre certificat et déposez-le à votre faculté.
                    </p>
                  </div>
                  <a
                    href="/api/student/dossier/certificate"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shrink-0"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimer le certificat
                  </a>
                </div>
              ) : profile.currentStep === 1 && profile.validations.length === 0 ? (
                <div className="flex items-center gap-3">
                  <Upload className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Documents requis</p>
                    <p className="text-blue-700 text-sm">
                      Veuillez téléverser tous les documents requis pour passer à l&apos;étape suivante.
                    </p>
                  </div>
                </div>
              ) : profile.dossierStatus === "SUBMITTED" ? (
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-medium text-orange-800">Dossier soumis — en attente de validation</p>
                    <p className="text-orange-700 text-sm">
                      Votre dossier est en cours d&apos;examen. Vous pouvez imprimer votre certificat de soumission.
                    </p>
                  </div>
                  <a
                    href="/api/student/dossier/submission-certificate"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium shrink-0"
                  >
                    <Printer className="h-4 w-4" />
                    Certificat de soumission
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-medium text-orange-800">En attente de validation</p>
                    <p className="text-orange-700 text-sm">
                      Votre dossier est en cours d&apos;examen. Vous serez notifié dès qu&apos;il sera traité.
                    </p>
                  </div>
                  {profile.dossierStatus !== "DRAFT" && (
                    <a
                      href="/api/student/dossier/submission-certificate"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shrink-0"
                    >
                      <Printer className="h-4 w-4" />
                      Certificat de soumission
                    </a>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900 font-medium">Niveau d&apos;études</p>
                  <p className="font-semibold text-gray-900">{getStudyLevelLabel(profile.studyLevel)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900 font-medium">Faculté</p>
                  <p className="font-semibold text-gray-900">{profile.faculty || "Non renseignée"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900 font-medium">Documents</p>
                  <p className="font-semibold text-gray-900">{profile.documents.length} fichier(s)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`${action.bg} p-3 rounded-full`}>
                        <action.icon className={`h-6 w-6 ${action.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{action.title}</p>
                        <p className="text-sm text-gray-900">{action.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-900" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Modal Nouvelle demande */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Nouvelle demande
            </h3>
            <p className="text-gray-600 mb-6">
              Choisissez le type de demande que vous souhaitez soumettre. 
              Vos documents précédents seront archivés.
            </p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleNewRequest('SOUTENANCE')}
                disabled={creatingRequest}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
              >
                <p className="font-medium text-gray-900">Soutenance de thèse</p>
                <p className="text-sm text-gray-600">
                  Demande de soutenance pour votre mémoire ou thèse
                </p>
              </button>
              
              <button
                onClick={() => handleNewRequest('AUTRE')}
                disabled={creatingRequest}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
              >
                <p className="font-medium text-gray-900">Autre demande</p>
                <p className="text-sm text-gray-600">
                  Autre type de demande administrative
                </p>
              </button>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewRequestModal(false)}
                disabled={creatingRequest}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
            
            {creatingRequest && (
              <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Création en cours...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
