import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { userRepository } from "@/lib/repositories";

interface RecentStudent {
  id: string;
  first_name: string;
  last_name: string;
  study_level: string;
  faculty: string;
  current_step: number;
  created_at: Date;
  email: string;
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const user = await userRepository.findById(session.user.id);

    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Statistiques globales
    const [
      totalStudentsResult,
      pendingResult,
      completedResult,
      byLevelResult,
      byStepResult,
      recentResult,
    ] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*) as count FROM students'),
      query<{ count: string }>(
        'SELECT COUNT(*) as count FROM students WHERE is_complete = false AND current_step > 0'
      ),
      query<{ count: string }>(
        'SELECT COUNT(*) as count FROM students WHERE is_complete = true'
      ),
      query<{ study_level: string; count: string }>(
        'SELECT study_level, COUNT(*) as count FROM students GROUP BY study_level'
      ),
      query<{ current_step: number; count: string }>(
        'SELECT current_step, COUNT(*) as count FROM students GROUP BY current_step ORDER BY current_step'
      ),
      query<RecentStudent>(
        `SELECT s.id, s.first_name, s.last_name, s.study_level, s.faculty, s.current_step, s.created_at, u.email 
         FROM students s 
         JOIN users u ON s.user_id = u.id 
         ORDER BY s.created_at DESC 
         LIMIT 5`
      ),
    ]);

    return NextResponse.json({
      totalStudents: parseInt(totalStudentsResult.rows[0].count),
      pendingValidations: parseInt(pendingResult.rows[0].count),
      completedRegistrations: parseInt(completedResult.rows[0].count),
      studentsPerLevel: byLevelResult.rows.map((s) => ({
        level: s.study_level,
        count: parseInt(s.count),
      })),
      studentsPerStep: byStepResult.rows.map((s) => ({
        step: s.current_step,
        count: parseInt(s.count),
      })),
      recentRegistrations: recentResult.rows.map((s) => ({
        ...s,
        user: { email: s.email },
      })),
    });
  } catch (error) {
    console.error("Erreur stats:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
