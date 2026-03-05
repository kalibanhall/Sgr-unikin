import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { userRepository, studentRepository, validationRepository, adminReviewRepository } from "@/lib/repositories";
import { sendEmail, getValidationEmailTemplate, getValidationCertificateEmailTemplate } from "@/lib/email";
import { generateCertificatePDF } from "@/lib/pdf-certificate";
import { ADMIN_LEVELS, FACULTIES } from "@/lib/constants";
import { logActivity, ACTION_TYPES } from "@/lib/activity-logger";

// Step that requires double validation (technical step)
const DOUBLE_VALIDATION_STEP = 2;
const REQUIRED_VALIDATIONS = 2;

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

    const stepNumber = parseInt(step);

    // Vérifier que l'admin a le niveau requis pour cette étape
    if (user.role !== "SUPER_ADMIN") {
      const adminLevel = user.admin_level || 1;
      const levelConfig = ADMIN_LEVELS.find(l => l.level === adminLevel);
      if (!levelConfig || !levelConfig.allowedSteps.includes(stepNumber)) {
        return NextResponse.json(
          { error: `Vous n'avez pas les droits pour intervenir sur l'étape ${stepNumber}. Votre niveau : ${adminLevel}` },
          { status: 403 }
        );
      }
    }

    // Récupérer l'étudiant
    const studentWithUser = await studentRepository.findWithUser(id);
    if (!studentWithUser) {
      return NextResponse.json({ error: "Étudiant non trouvé" }, { status: 404 });
    }

    const student = studentWithUser;

    // Double validation logic for technical step
    if (stepNumber === DOUBLE_VALIDATION_STEP && status === "APPROVED") {
      // Check if this admin has already validated this step
      const existingValidation = await query(
        `SELECT * FROM technical_validations 
         WHERE student_id = $1 AND step = $2 AND admin_id = $3`,
        [id, stepNumber, session.user.id]
      );

      if (existingValidation.rows.length > 0) {
        return NextResponse.json(
          { error: "Vous avez déjà validé cette étape technique" },
          { status: 400 }
        );
      }

      // Add this admin's technical validation
      await query(
        `INSERT INTO technical_validations (id, student_id, step, admin_id, status, comment)
         VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)`,
        [id, stepNumber, session.user.id, status, comment || null]
      );

      // Count total validations for this step
      const validationCount = await query(
        `SELECT COUNT(*) as count FROM technical_validations 
         WHERE student_id = $1 AND step = $2 AND status = 'APPROVED'`,
        [id, stepNumber]
      );

      const count = parseInt(validationCount.rows[0].count);

      // Créer un avis admin (visible par le Super Admin)
      await adminReviewRepository.create({
        studentId: id,
        adminId: session.user.id,
        step: stepNumber,
        decision: status,
        comment: comment || null,
        isPrivate: true,
      });

      // If not enough validations yet, return pending status
      if (count < REQUIRED_VALIDATIONS) {
        return NextResponse.json({
          success: true,
          message: `Validation technique enregistrée (${count}/${REQUIRED_VALIDATIONS}). En attente d'une deuxième validation.`,
          validationCount: count,
          requiredValidations: REQUIRED_VALIDATIONS,
          pending: true,
        });
      }

      // If we have enough validations, proceed with full validation
    }

    // Créer ou mettre à jour la validation
    await validationRepository.upsert({
      studentId: id,
      step: parseInt(step),
      status: status,
      comment: comment || null,
      validatedBy: user.name || user.email,
      validatedAt: new Date(),
    });

    // Log activity
    await logActivity({
      adminId: session.user.id,
      actionType: status === 'APPROVED' ? ACTION_TYPES.VALIDATE_STEP : ACTION_TYPES.REJECT_STEP,
      targetType: 'STUDENT',
      targetId: id,
      details: {
        studentName: `${student.first_name} ${student.last_name}`,
        step: stepNumber,
        decision: status,
        comment: comment || null,
      },
    });

    // Créer un avis admin (visible par le Super Admin) - only if not already created for double validation
    if (stepNumber !== DOUBLE_VALIDATION_STEP || status !== "APPROVED") {
      await adminReviewRepository.create({
        studentId: id,
        adminId: session.user.id,
        step: parseInt(step),
        decision: status,
        comment: comment || null,
        isPrivate: true,
      });
    }

    // Mettre à jour l'étape de l'étudiant si validé
    if (status === "APPROVED") {
      const newStep = Math.max(student.current_step, parseInt(step) + 1);
      const isComplete = newStep >= student.max_steps;

      await studentRepository.update(id, {
        currentStep: newStep,
        isComplete: isComplete,
        dossierStatus: isComplete ? "VALIDATED" : student.dossier_status,
      });

      // Si dossier complet, envoyer le certificat de validation en PDF
      if (isComplete) {
        const facultyEntry = FACULTIES.find(f => f.code === student.faculty);
        const facultyName = facultyEntry?.name || student.faculty || "Non spécifiée";
        const studentName = `${(student.last_name || "").toUpperCase()} ${student.first_name}`;
        const department = student.department || "Non spécifié";
        const thesisTitle = student.thesis_title || "Non spécifié";

        const now = new Date();
        const year = now.getFullYear();
        const idPart = student.id.replace(/-/g, "").substring(0, 7).toUpperCase();
        const referenceNumber = `SGR/${idPart}/${year}`;

        const submissionDate = student.submitted_at
          ? new Date(student.submitted_at).toLocaleDateString("fr-CD", { day: "2-digit", month: "2-digit", year: "numeric" })
          : "N/A";
        const validationDate = now.toLocaleDateString("fr-CD", { day: "2-digit", month: "2-digit", year: "numeric" });

        // Générer le certificat PDF
        let pdfBytes: Uint8Array | null = null;
        try {
          pdfBytes = await generateCertificatePDF({
            referenceNumber,
            studentName,
            faculty: facultyName,
            department,
            thesisTitle,
            submissionDate,
            emissionDate: validationDate,
          });
        } catch (pdfErr) {
          console.error("Erreur génération certificat PDF:", pdfErr);
        }

        const certTemplate = getValidationCertificateEmailTemplate(
          studentName,
          referenceNumber,
          validationDate,
        );

        await sendEmail({
          to: student.user.email,
          subject: certTemplate.subject,
          html: certTemplate.html,
          text: certTemplate.text,
          ...(pdfBytes ? {
            attachments: [{
              filename: `Certificat_Validation_${referenceNumber.replace(/\//g, '_')}.pdf`,
              content: pdfBytes,
              contentType: 'application/pdf',
            }],
          } : {}),
        });
      }
    }

    // Envoyer un email de notification
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const dashboardUrl = `${baseUrl}/dashboard`;
    const emailTemplate = getValidationEmailTemplate(
      student.first_name,
      status === "APPROVED" ? "approved" : "rejected",
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
