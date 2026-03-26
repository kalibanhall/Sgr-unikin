"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Loader2, 
  FileText,
  Download,
  Eye
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface StudentWithDocs {
  id: string;
  firstName: string;
  lastName: string;
  currentStep: number;
  user: { email: string };
  documents: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
    uploadedAt: string;
  }>;
}

export default function AdminDocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<StudentWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/students?limit=100&includeDocuments=true`);
      if (res.ok) {
        const data = await res.json();
        // Filtrer uniquement les étudiants avec des documents
        setStudents(data.students.filter((s: StudentWithDocs) => s.documents.length > 0));
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user) {
      fetchStudents();
    }
  }, [session, fetchStudents]);

  const filteredStudents = students.filter((s) => {
    const searchLower = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(searchLower) ||
      s.lastName.toLowerCase().includes(searchLower) ||
      s.user.email.toLowerCase().includes(searchLower)
    );
  });

  const totalDocuments = students.reduce((acc, s) => acc + s.documents.length, 0);

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des documents</h1>
          <p className="text-gray-900 mt-1">
            {totalDocuments} document(s) de {students.length} candidat(s)
          </p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un candidat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Students with documents */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun document trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredStudents.map((student) => (
              <Card key={student.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {student.firstName} {student.lastName}
                      </CardTitle>
                      <p className="text-sm text-gray-500">{student.user.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={student.currentStep >= 4 ? "success" : "pending"}>
                        Étape {Math.min(student.currentStep, 4)}/4
                      </Badge>
                      <Link href={`/admin/etudiants/${student.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir le dossier
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {student.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {doc.type} • {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
