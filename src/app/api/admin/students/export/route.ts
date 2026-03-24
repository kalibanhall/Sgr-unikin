import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { userRepository } from "@/lib/repositories";
import { FACULTIES, ADMIN_LEVELS } from "@/lib/constants";

interface ExportRow {
  first_name: string;
  last_name: string;
  email: string;
  faculty: string | null;
  department: string | null;
  study_level: string;
  dossier_type: string;
  dossier_status: string;
  current_step: number;
  thesis_title: string | null;
  supervisor: string | null;
  submitted_at: Date | null;
  reference_number: string | null;
}

// GET - Exporter la liste des étudiants en CSV
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dossierStatus = searchParams.get("dossierStatus");
    const dossierType = searchParams.get("dossierType");
    const studyLevel = searchParams.get("studyLevel");

    // Filtrage par niveau admin
    const adminLevel = user.admin_level || 1;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const levelConfig = ADMIN_LEVELS.find(l => l.level === adminLevel);
    const allowedSteps = isSuperAdmin ? null : (levelConfig?.allowedSteps ?? [0, 1]);

    let sql = `
      SELECT s.first_name, s.last_name, u.email, s.faculty, s.department,
             s.study_level, s.dossier_type, s.dossier_status, s.current_step,
             s.thesis_title, s.supervisor, s.submitted_at, s.reference_number
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.dossier_status != 'DRAFT'
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (dossierStatus) {
      sql += ` AND s.dossier_status = $${paramIndex}`;
      params.push(dossierStatus);
      paramIndex++;
    }

    if (dossierType) {
      sql += ` AND s.dossier_type = $${paramIndex}`;
      params.push(dossierType);
      paramIndex++;
    }

    if (studyLevel) {
      sql += ` AND s.study_level = $${paramIndex}`;
      params.push(studyLevel);
      paramIndex++;
    }

    if (allowedSteps) {
      const placeholders = allowedSteps.map((_, i) => `$${paramIndex + i}`).join(', ');
      sql += ` AND s.current_step IN (${placeholders})`;
      allowedSteps.forEach(s => params.push(s));
      paramIndex += allowedSteps.length;
    }

    sql += ` ORDER BY s.submitted_at DESC`;

    const result = await query<ExportRow>(sql, params);

    // Construire le CSV
    const BOM = "\uFEFF"; // UTF-8 BOM pour Excel
    const headers = [
      "Nom", "Prénom", "Email", "Faculté", "Département",
      "Niveau", "Type de dossier", "Statut", "Étape",
      "Sujet", "Directeur", "Date de soumission", "N° Référence"
    ];

    const escapeCSV = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const rows = result.rows.map((r) => {
      const facultyEntry = FACULTIES.find(f => f.code === r.faculty);
      const facultyName = facultyEntry?.name || r.faculty || "";
      const typeLabel = r.dossier_type === "SOUTENANCE" ? "Soutenance" : r.dossier_type === "AUTRE" ? "Autre" : "Inscription";
      const statusLabel = r.dossier_status === "SUBMITTED" ? "Soumis"
        : r.dossier_status === "VALIDATED" ? "Validé"
        : r.dossier_status === "COMPLETED" ? "Complété"
        : r.dossier_status;
      const submittedDate = r.submitted_at
        ? new Date(r.submitted_at).toLocaleDateString("fr-CD", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "";

      return [
        r.last_name || "",
        r.first_name || "",
        r.email || "",
        facultyName,
        r.department || "",
        r.study_level || "",
        typeLabel,
        statusLabel,
        `${r.current_step}/4`,
        r.thesis_title || "",
        r.supervisor || "",
        submittedDate,
        r.reference_number || "",
      ].map(escapeCSV).join(",");
    });

    const csv = BOM + headers.map(escapeCSV).join(",") + "\n" + rows.join("\n");

    const now = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="SGR_Export_${now}.csv"`,
      },
    });
  } catch (error) {
    console.error("Erreur export:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
