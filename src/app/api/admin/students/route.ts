import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { userRepository } from "@/lib/repositories";
import { ADMIN_LEVELS } from "@/lib/constants";

interface StudentListRow {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_created_at: Date;
  documents_count: string;
  faculty: string | null;
  department: string | null;
  study_level: string;
  current_step: number;
  max_steps: number;
  is_complete: boolean;
  dossier_status: string;
  dossier_type: string;
  created_at: Date;
}

// GET - Récupérer tous les étudiants (admin seulement)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
    const user = await userRepository.findById(session.user.id);

    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const step = searchParams.get("step");
    const studyLevel = searchParams.get("studyLevel");
    const dossierStatus = searchParams.get("dossierStatus");
    const dossierType = searchParams.get("dossierType");
    const includeDocuments = searchParams.get("includeDocuments") === "true";

    // Filtrage par niveau admin: chaque admin ne voit que les dossiers à son niveau
    const adminLevel = user.admin_level || 1;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const levelConfig = ADMIN_LEVELS.find(l => l.level === adminLevel);
    const allowedSteps = isSuperAdmin ? null : (levelConfig?.allowedSteps ?? [0, 1]);

    let sql = `
      SELECT s.*, u.email, u.created_at as user_created_at,
             COUNT(d.id) as documents_count
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN documents d ON d.student_id = s.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (
        LOWER(s.first_name) LIKE $${paramIndex} OR 
        LOWER(s.last_name) LIKE $${paramIndex} OR 
        LOWER(u.email) LIKE $${paramIndex}
      )`;
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    if (step) {
      sql += ` AND s.current_step = $${paramIndex}`;
      params.push(parseInt(step));
      paramIndex++;
    }

    if (studyLevel) {
      sql += ` AND s.study_level = $${paramIndex}`;
      params.push(studyLevel);
      paramIndex++;
    }

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

    // Filtrer par les étapes autorisées pour ce niveau admin
    if (allowedSteps) {
      const placeholders = allowedSteps.map((_, i) => `$${paramIndex + i}`).join(', ');
      sql += ` AND s.current_step IN (${placeholders})`;
      allowedSteps.forEach(s => params.push(s));
      paramIndex += allowedSteps.length;
    }

    sql += ` GROUP BY s.id, u.email, u.created_at, s.submitted_at
      ORDER BY
        COALESCE(
          (SELECT MAX(v.validated_at) FROM validations v WHERE v.student_id = s.id AND v.status = 'APPROVED'),
          s.submitted_at
        ) ASC NULLS LAST,
        s.submitted_at ASC NULLS LAST`;
    sql += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    const studentsResult = await query<StudentListRow>(sql, params);

    // Compter le total
    let countSql = 'SELECT COUNT(DISTINCT s.id) as count FROM students s JOIN users u ON s.user_id = u.id WHERE 1=1';
    const countParams: unknown[] = [];
    let countParamIndex = 1;

    if (search) {
      countSql += ` AND (
        LOWER(s.first_name) LIKE $${countParamIndex} OR 
        LOWER(s.last_name) LIKE $${countParamIndex} OR 
        LOWER(u.email) LIKE $${countParamIndex}
      )`;
      countParams.push(`%${search.toLowerCase()}%`);
      countParamIndex++;
    }

    if (step) {
      countSql += ` AND s.current_step = $${countParamIndex}`;
      countParams.push(parseInt(step));
      countParamIndex++;
    }

    if (studyLevel) {
      countSql += ` AND s.study_level = $${countParamIndex}`;
      countParams.push(studyLevel);
      countParamIndex++;
    }

    if (dossierStatus) {
      countSql += ` AND s.dossier_status = $${countParamIndex}`;
      countParams.push(dossierStatus);
      countParamIndex++;
    }

    if (dossierType) {
      countSql += ` AND s.dossier_type = $${countParamIndex}`;
      countParams.push(dossierType);
      countParamIndex++;
    }

    // Même filtre par étapes autorisées pour le count
    if (allowedSteps) {
      const placeholders = allowedSteps.map((_, i) => `$${countParamIndex + i}`).join(', ');
      countSql += ` AND s.current_step IN (${placeholders})`;
      allowedSteps.forEach(s => countParams.push(s));
      countParamIndex += allowedSteps.length;
    }

    const countResult = await query<{ count: string }>(countSql, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Récupérer les validations pour chaque étudiant et transformer en camelCase
    const students = await Promise.all(
      studentsResult.rows.map(async (student) => {
        const validationsResult = await query(
          'SELECT * FROM validations WHERE student_id = $1 ORDER BY step ASC',
          [student.id]
        );
        return {
          id: student.id,
          firstName: student.first_name,
          lastName: student.last_name,
          studyLevel: student.study_level,
          faculty: student.faculty,
          department: student.department,
          currentStep: student.current_step,
          maxSteps: student.max_steps,
          isComplete: student.is_complete,
          dossierStatus: student.dossier_status,
          dossierType: student.dossier_type,
          createdAt: student.created_at,
          user: {
            email: student.email,
            createdAt: student.user_created_at,
          },
          documents: includeDocuments ? await query(
            'SELECT id, name, type, url, size, uploaded_at FROM documents WHERE student_id = $1 ORDER BY uploaded_at DESC',
            [student.id]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ).then(r => r.rows.map((d: any) => ({
            id: d.id,
            name: d.name,
            type: d.type,
            url: d.url,
            size: d.size,
            uploadedAt: d.uploaded_at,
          }))) : [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          validations: validationsResult.rows.map((v: any) => ({
            step: v.step,
            status: v.status,
            comment: v.comment,
            validatedAt: v.validated_at,
          })),
        };
      })
    );

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
