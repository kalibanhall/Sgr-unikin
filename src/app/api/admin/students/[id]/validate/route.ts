import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userRepository, studentRepository, validationRepository, adminReviewRepository } from "@/lib/repositories";
import { sendEmail, getValidationEmailTemplate } from "@/lib/email";

// POST - Valider ou rejeter une étape
export async function POST(
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
    const { step, status, comment } = body;

    if (!step || !status) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Récupérer l'étudiant
    const studentWithUser = await studentRepository.findWithUser(id);
    if (!studentWithUser) {
      return NextResponse.json({ error: "Étudiant non trouvé" }, { status: 404 });
    }

    const student = studentWithUser;

    // Créer ou mettre à jour la validation
    await validationRepository.upsert({
      studentId: id,
      step: parseInt(step),
      status: status,
      comment: comment || null,
      validatedBy: user.name || user.email,
      validatedAt: new Date(),
    });

    // Créer un avis admin (visible par le Super Admin)
    await adminReviewRepository.create({
      studentId: id,
      adminId: session.user.id,
      step: parseInt(step),
      decision: status,
      comment: comment || null,
      isPrivate: true,
    });

    // Mettre à jour l'étape de l'étudiant si validé
    if (status === "APPROVED") {
      const newStep = Math.max(student.current_step, parseInt(step) + 1);
      const isComplete = newStep >= student.max_steps;

      await studentRepository.update(id, {
        currentStep: newStep,
        isComplete: isComplete,
        dossierStatus: isComplete ? "VALIDATED" : student.dossier_status,
      });
    }

    // Envoyer un email de notification
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const dashboardUrl = `${baseUrl}/dashboard`;
    const emailTemplate = getValidationEmailTemplate(
      student.first_name,
      status === "APPROVED",
      comment || "",
      dashboardUrl
    );

    await sendEmail({
      to: student.user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return NextResponse.json({
      success: true,
      message: status === "APPROVED" ? "Étape validée" : "Étape rejetée",
    });
  } catch (error) {
    console.error("Erreur validation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
