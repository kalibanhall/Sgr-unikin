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

interface RecentAdminAction {
  id: string;
  step: number;
  decision: string;
  comment: string | null;
  created_at: Date;
  admin_name: string | null;
  admin_email: string;
  student_id: string;
  student_first_name: string;
  student_last_name: string;
}

export async function GET() {
  try {
    const session = await auth();
    
    console.log("=== STATS DEBUG ===");
    console.log("Session:", session?.user ? { id: session.user.id, role: session.user.role } : "null");
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const user = await userRepository.findById(session.user.id);
    console.log("User from DB:", user ? { id: user.id, role: user.role } : "null");

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

    // Recent admin actions (for super admin only)
    let recentAdminActions: Array<{
      id: string;
      step: number;
      decision: string;
      comment: string | null;
      createdAt: Date;
      admin: { name: string | null; email: string };
      student: { id: string; firstName: string; lastName: string };
    }> = [];

    if (user.role === "SUPER_ADMIN") {
      const actionsResult = await query<RecentAdminAction>(
        `SELECT ar.id, ar.step, ar.decision, ar.comment, ar.created_at,
                u.name as admin_name, u.email as admin_email,
                s.id as student_id, s.first_name as student_first_name, s.last_name as student_last_name
         FROM admin_reviews ar
         JOIN users u ON ar.admin_id = u.id
         JOIN students s ON ar.student_id = s.id
         ORDER BY ar.created_at DESC
         LIMIT 10`
      );

      recentAdminActions = actionsResult.rows.map((a) => ({
        id: a.id,
        step: a.step,
        decision: a.decision,
        comment: a.comment,
        createdAt: a.created_at,
        admin: { name: a.admin_name, email: a.admin_email },
        student: { id: a.student_id, firstName: a.student_first_name, lastName: a.student_last_name },
      }));
    }

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
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        studyLevel: s.study_level,
        currentStep: s.current_step,
        createdAt: s.created_at,
        user: { email: s.email },
      })),
      recentAdminActions,
    });
  } catch (error) {
    console.error("Erreur stats:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: String(error) },
      { status: 500 }
    );
  }
}
