"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserCheck, 
  GraduationCap, 
  BookOpen, 
  Loader2,
  CheckCircle
} from "lucide-react";

interface ValidatedStudent {
  firstName: string;
  lastName: string;
  faculty: string | null;
  department: string | null;
  studyLevel: string;
  dossierType: string;
  specialization: string | null;
}

const levelLabels: Record<string, string> = {
  LICENCE: "Licence",
  MASTER: "Master/DES/DEA",
  DOCTORAT: "Doctorat",
};

const typeLabels: Record<string, string> = {
  INSCRIPTION: "Inscription",
  SOUTENANCE: "Soutenance",
};

export function ValidatedStudentsList() {
  const [students, setStudents] = useState<ValidatedStudent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/students/validated")
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.students || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Ne pas afficher la section s'il n'y a aucun candidat validé
  if (!loading && total === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <UserCheck className="h-4 w-4" />
            Candidats validés
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            Dossiers approuvés
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm">
            Liste des candidats dont le dossier a été validé à toutes les étapes
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student, index) => (
                <Card key={index} className="border border-green-100 hover:shadow-md transition-shadow">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 text-sm truncate">
                          {student.lastName} {student.firstName}
                        </h3>
                        {student.faculty && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {student.faculty}
                            {student.department ? ` — ${student.department}` : ""}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Badge className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0 font-medium">
                            {levelLabels[student.studyLevel] || student.studyLevel}
                          </Badge>
                          <Badge className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0 font-medium">
                            {typeLabels[student.dossierType] || student.dossierType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-green-700">{total}</span> dossier{total > 1 ? "s" : ""} validé{total > 1 ? "s" : ""} à ce jour
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
