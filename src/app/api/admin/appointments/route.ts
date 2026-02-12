import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userRepository, appointmentRepository } from "@/lib/repositories";

// GET - Récupérer tous les rendez-vous (admin)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const appointments = await appointmentRepository.findMany();

    // Transformer en camelCase pour le frontend
    const formattedAppointments = appointments.map((a: Record<string, unknown>) => ({
      id: a.id,
      targetRole: a.target_role,
      subject: a.subject,
      message: a.message,
      requestedDate: a.requested_date,
      approvedDate: a.approved_date,
      adminNote: a.admin_note,
      status: a.status,
      createdAt: a.created_at,
      student: {
        firstName: a.first_name,
        lastName: a.last_name,
        studyLevel: a.study_level,
        faculty: a.faculty,
        user: {
          email: a.email,
        },
      },
    }));

    return NextResponse.json(formattedAppointments);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
