import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { appointmentRepository } from "@/lib/repositories";

// GET /api/student/appointments - Récupérer les rendez-vous de l'étudiant
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.studentId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const appointments = await appointmentRepository.findByStudentId(session.user.studentId);

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/student/appointments - Créer une demande de rendez-vous
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.studentId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();
    const { targetRole, subject, message, requestedDate } = data;

    if (!targetRole || !subject || !requestedDate) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    const appointment = await appointmentRepository.create({
      studentId: session.user.studentId,
      targetRole,
      subject,
      message,
      requestedDate: new Date(requestedDate),
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
