import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userRepository, appointmentRepository } from "@/lib/repositories";
import { logActivity, ACTION_TYPES } from "@/lib/activity-logger";

// PUT - Mettre à jour un rendez-vous (approuver/rejeter)
export async function PUT(
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
    const body = await request.json();
    const { status, approvedDate, adminNote } = body;

    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      return NextResponse.json({ error: "Rendez-vous non trouvé" }, { status: 404 });
    }

    const updated = await appointmentRepository.update(id, {
      status: status as 'PENDING' | 'APPROVED' | 'REJECTED',
      approvedDate: approvedDate ? new Date(approvedDate) : null,
      adminNote: adminNote || null,
    });

    // Log activity
    if (status === 'APPROVED' || status === 'REJECTED') {
      await logActivity({
        adminId: session.user.id,
        actionType: status === 'APPROVED' ? ACTION_TYPES.APPROVE_APPOINTMENT : ACTION_TYPES.REJECT_APPOINTMENT,
        targetType: 'APPOINTMENT',
        targetId: id,
        details: {
          appointmentSubject: appointment.subject,
          decision: status,
          adminNote: adminNote || null,
        },
      });
    }

    // Transformer en camelCase pour le frontend
    const updatedAppointment = updated ? {
      id: updated.id,
      targetRole: updated.target_role,
      subject: updated.subject,
      message: updated.message,
      requestedDate: updated.requested_date,
      approvedDate: updated.approved_date,
      adminNote: updated.admin_note,
      status: updated.status,
      createdAt: updated.created_at,
    } : null;

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
