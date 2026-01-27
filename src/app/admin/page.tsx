"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  Loader2,
  TrendingUp,
  GraduationCap,
  UserCog,
  Calendar,
  FolderOpen
} from "lucide-react";
import Link from "next/link";
import { getStudyLevelLabel, formatDate } from "@/lib/utils";

interface Stats {
  totalStudents: number;
  pendingValidations: number;
  completedRegistrations: number;
  studentsPerLevel: Array<{ level: string; count: number }>;
  studentsPerStep: Array<{ step: number; count: number }>;
  recentRegistrations: Array<{
    id: string;
    firstName: string;
    lastName: string;
    studyLevel: string;
    currentStep: number;
    createdAt: string;
    user: { email: string };
  }>;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchStats();
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: "Total étudiants",
      value: stats.totalStudents,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "En attente de validation",
      value: stats.pendingValidations,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "Inscriptions complètes",
      value: stats.completedRegistrations,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Taux de complétion",
      value: stats.totalStudents > 0 
        ? `${Math.round((stats.completedRegistrations / stats.totalStudents) * 100)}%`
        : "0%",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
              <p className="text-gray-600 mt-1">
                Vue d&apos;ensemble de la gestion des inscriptions
              </p>
            </div>
          </div>

          {/* Navigation rapide */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/admin/etudiants">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-3 p-4">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Étudiants</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/rendez-vous">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-3 p-4">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Rendez-vous</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/documents">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-3 p-4">
                  <FolderOpen className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-gray-900">Documents</span>
                </CardContent>
              </Card>
            </Link>
            {session?.user?.role === "SUPER_ADMIN" && (
              <Link href="/admin/administrateurs">
                <Card className="cursor-pointer hover:shadow-md transition-shadow border-purple-200 bg-purple-50">
                  <CardContent className="flex items-center gap-3 p-4">
                    <UserCog className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Gérer les Administrateurs</span>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700 font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-full`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Étudiants par niveau */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Répartition par niveau
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.studentsPerLevel.map((item) => (
                  <div key={item.level} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="font-medium">{getStudyLevelLabel(item.level)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${(item.count / stats.totalStudents) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 font-medium w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Étudiants par étape */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Répartition par étape
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.studentsPerStep.sort((a, b) => a.step - b.step).map((item) => (
                  <div key={item.step} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          item.step === 4 ? "bg-green-500" : "bg-orange-500"
                        }`} 
                      />
                      <span className="font-medium">
                        Étape {item.step}/4
                        {item.step === 4 && " (Complet)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.step === 4 ? "bg-green-500" : "bg-orange-500"
                          }`}
                          style={{
                            width: `${(item.count / stats.totalStudents) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 font-medium w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inscriptions récentes */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Inscriptions récentes</CardTitle>
              <Link href="/admin/etudiants" className="text-blue-600 hover:underline text-sm">
                Voir tous les étudiants →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Nom</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Niveau</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Étape</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentRegistrations.map((student) => (
                    <tr key={student.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link 
                          href={`/admin/etudiants/${student.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {student.firstName} {student.lastName}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{student.user.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">
                          {getStudyLevelLabel(student.studyLevel)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={student.currentStep === 4 ? "success" : "pending"}
                        >
                          {student.currentStep}/4
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {formatDate(student.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
