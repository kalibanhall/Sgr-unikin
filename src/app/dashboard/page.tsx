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
  ArrowRight
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
    if (profile.isComplete) {
      return <Badge variant="success" className="text-base px-4 py-1.5 font-semibold">Inscription complète</Badge>;
    }
    const lastValidation = profile.validations[profile.validations.length - 1];
    if (lastValidation?.status === "REJECTED") {
      return <Badge variant="destructive" className="text-base px-4 py-1.5 font-semibold">Action requise</Badge>;
    }
    if (profile.dossierStatus === "SUBMITTED" || profile.validations.length > 0) {
      return (
        <Badge className="bg-amber-500 text-white text-base px-4 py-2 font-bold shadow-md border-2 border-amber-600">
          🔄 En cours de validation
        </Badge>
      );
    }
    return <Badge variant="secondary" className="text-base px-4 py-1.5 font-semibold">Brouillon</Badge>;
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenue, {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-gray-900 mt-1">
            Gérez votre dossier d&apos;inscription au troisième cycle
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>État de votre dossier</CardTitle>
                <CardDescription>
                  Inscrit depuis le {formatDate(profile.createdAt)}
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
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Félicitations !</p>
                    <p className="text-green-700 text-sm">
                      Votre inscription est complète. Vous pouvez télécharger votre attestation.
                    </p>
                  </div>
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
              ) : (
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">En attente de validation</p>
                    <p className="text-orange-700 text-sm">
                      Votre dossier est en cours d&apos;examen. Vous serez notifié dès qu&apos;il sera traité.
                    </p>
                  </div>
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
    </div>
  );
}
