"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STUDY_LEVELS } from "@/lib/constants";
import { 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  FileText,
  Download
} from "lucide-react";
import Link from "next/link";
import { getStudyLevelLabel, formatDate } from "@/lib/utils";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studyLevel: string;
  faculty: string;
  currentStep: number;
  isComplete: boolean;
  dossierStatus: string;
  dossierType: string;
  createdAt: string;
  user: {
    email: string;
  };
  documents: Array<{ id: string }>;
  validations: Array<{
    step: number;
    status: string;
    comment: string | null;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminStudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [stepFilter, setStepFilter] = useState(searchParams.get("step") || "");
  const [levelFilter, setLevelFilter] = useState(searchParams.get("level") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", pagination.page.toString());
    params.set("limit", "20");
    if (search) params.set("search", search);
    if (stepFilter) params.set("step", stepFilter);
    if (levelFilter) params.set("studyLevel", levelFilter);
    if (statusFilter) params.set("dossierStatus", statusFilter);
    if (typeFilter) params.set("dossierType", typeFilter);

    try {
      const res = await fetch(`/api/admin/students?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, stepFilter, levelFilter, statusFilter, typeFilter]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    // fetchStudents sera appelé automatiquement grâce au useEffect
  };

  const resetFilters = () => {
    setSearch("");
    setStepFilter("");
    setLevelFilter("");
    setStatusFilter("");
    setTypeFilter("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Ajouter un useEffect pour relancer la recherche quand les filtres changent
  useEffect(() => {
    if (session?.user) {
      const timer = setTimeout(() => {
        fetchStudents();
      }, 300); // Debounce de 300ms
      return () => clearTimeout(timer);
    }
  }, [search, stepFilter, levelFilter, statusFilter, typeFilter, pagination.page, session, fetchStudents]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des candidats</h1>
            <p className="text-gray-900 mt-1">
              {pagination.total} candidat(s) inscrit(s)
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                const params = new URLSearchParams({
                  ...(levelFilter && levelFilter !== "all" ? { studyLevel: levelFilter } : {}),
                  ...(statusFilter && statusFilter !== "all" ? { dossierStatus: statusFilter } : {}),
                  ...(typeFilter && typeFilter !== "all" ? { dossierType: typeFilter } : {}),
                });
                const res = await fetch(`/api/admin/students/export?${params}`);
                if (!res.ok) {
                  const err = await res.json().catch(() => ({ error: "Erreur export" }));
                  alert(err.error || "Erreur lors de l'export");
                  return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const now = new Date().toISOString().slice(0, 10);
                a.download = `SGR_Export_${now}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch {
                alert("Erreur de connexion lors de l'export");
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par nom ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={stepFilter} onValueChange={setStepFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Étape" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les étapes</SelectItem>
                  <SelectItem value="0">Étape 0</SelectItem>
                  <SelectItem value="1">Étape 1</SelectItem>
                  <SelectItem value="2">Étape 2</SelectItem>
                  <SelectItem value="3">Étape 3</SelectItem>
                  <SelectItem value="4">Complet</SelectItem>
                </SelectContent>
              </Select>

              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  {STUDY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Statut dossier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="DRAFT">Non soumis</SelectItem>
                  <SelectItem value="SUBMITTED">Soumis</SelectItem>
                  <SelectItem value="VALIDATED">Validé</SelectItem>
                  <SelectItem value="COMPLETED">Complété</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-52">
                  <SelectValue placeholder="Type de dossier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="INSCRIPTION">Inscription en thèse</SelectItem>
                  <SelectItem value="SOUTENANCE">Soutenance</SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit">Rechercher</Button>
              <Button type="button" variant="outline" onClick={resetFilters}>
                Réinitialiser
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des candidats</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-gray-900">
                Aucun candidat trouvé
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Nom</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Niveau</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Faculté</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Documents</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Étape</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Statut</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        // Indicateur visuel : fond coloré selon l'état de validation
                        const hasRejection = student.validations?.some(v => v.status === "REJECTED");
                        const isValidatedStep1 = student.validations?.some(v => v.step === 1 && v.status === "APPROVED");
                        const rowBg = hasRejection
                          ? "bg-red-50 hover:bg-red-100"
                          : student.dossierStatus === "VALIDATED" || student.dossierStatus === "COMPLETED"
                          ? "bg-green-50 hover:bg-green-100"
                          : isValidatedStep1
                          ? "bg-blue-50 hover:bg-blue-100"
                          : "hover:bg-gray-50";
                        return (
                        <tr key={student.id} className={`border-b last:border-b-0 ${rowBg}`}>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </td>
                          <td className="py-3 px-4 text-gray-900 text-sm">
                            {student.user.email}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">
                              {getStudyLevelLabel(student.studyLevel)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={student.dossierType === "SOUTENANCE" ? "pending" : "secondary"} className="text-xs">
                              {student.dossierType === "INSCRIPTION" ? "Inscription" : student.dossierType === "SOUTENANCE" ? "Soutenance" : student.dossierType || "—"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-900">
                            {student.faculty || "—"}
                          </td>
                          <td className="py-3 px-4">
                            {student.documents.length > 0 ? (
                              <span className="flex items-center gap-1 text-blue-600">
                                <FileText className="h-4 w-4" />
                                {student.documents.length}
                              </span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={student.isComplete ? "success" : "pending"}
                            >
                              {student.currentStep}/4
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                student.dossierStatus === "VALIDATED" || student.dossierStatus === "COMPLETED"
                                  ? "success"
                                  : student.dossierStatus === "SUBMITTED"
                                  ? "pending"
                                  : "secondary"
                              }
                            >
                              {student.dossierStatus === "DRAFT" ? "Non soumis" 
                                : student.dossierStatus === "SUBMITTED" ? "Soumis"
                                : student.dossierStatus === "VALIDATED" ? "Validé"
                                : student.dossierStatus === "COMPLETED" ? "Complété"
                                : student.dossierStatus}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-900 text-sm">
                            {formatDate(student.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <Link href={`/admin/etudiants/${student.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                              </Button>
                            </Link>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-gray-900">
                      Page {pagination.page} sur {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === 1}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      >
                        Suivant
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
