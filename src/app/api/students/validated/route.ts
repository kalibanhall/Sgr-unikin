import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/students/validated - Liste publique des candidats validés à toutes les étapes
export async function GET() {
  try {
    const result = await query(`
      SELECT 
        s.first_name,
        s.last_name,
        s.faculty,
        s.department,
        s.study_level,
        s.dossier_type,
        s.specialization
      FROM students s
      JOIN validations v ON v.student_id = s.id AND v.status = 'APPROVED'
      GROUP BY s.id
      HAVING COUNT(DISTINCT v.step) = 5
      ORDER BY s.last_name ASC, s.first_name ASC
    `);

    return NextResponse.json({
      students: result.rows.map((s: Record<string, unknown>) => ({
        firstName: s.first_name,
        lastName: s.last_name,
        faculty: s.faculty,
        department: s.department,
        studyLevel: s.study_level,
        dossierType: s.dossier_type,
        specialization: s.specialization,
      })),
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ students: [], total: 0 });
  }
}
