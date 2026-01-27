import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { userRepository } from "@/lib/repositories";

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

    sql += ` GROUP BY s.id, u.email, u.created_at ORDER BY s.created_at DESC`;
    sql += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    const studentsResult = await query(sql, params);

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
    }

    const countResult = await query<{ count: string }>(countSql, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Récupérer les validations pour chaque étudiant
    const students = await Promise.all(
      studentsResult.rows.map(async (student: Record<string, unknown>) => {
        const validationsResult = await query(
          'SELECT * FROM validations WHERE student_id = $1 ORDER BY step ASC',
          [student.id]
        );
        return {
          ...student,
          user: {
            email: student.email,
            createdAt: student.user_created_at,
          },
          documents: [],
          validations: validationsResult.rows,
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
