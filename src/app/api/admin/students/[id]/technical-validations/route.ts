import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { userRepository } from "@/lib/repositories";

// GET - Get technical validation count for a student's step
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const step = request.nextUrl.searchParams.get("step") || "2";
    const stepNumber = parseInt(step);

    // Get count of technical validations (without revealing who)
    const result = await query(
      `SELECT COUNT(*) as count FROM technical_validations 
       WHERE student_id = $1 AND step = $2 AND status = 'APPROVED'`,
      [id, stepNumber]
    );

    const count = parseInt(result.rows[0]?.count || "0");

    // Check if current admin has already validated
    const hasValidated = await query(
      `SELECT 1 FROM technical_validations 
       WHERE student_id = $1 AND step = $2 AND admin_id = $3`,
      [id, stepNumber, session.user.id]
    );

    return NextResponse.json({
      count,
      requiredValidations: 2,
      hasCurrentAdminValidated: hasValidated.rows.length > 0,
      isComplete: count >= 2,
    });
  } catch (error) {
    console.error("Error getting technical validations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
