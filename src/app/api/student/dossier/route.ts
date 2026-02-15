import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { studentRepository, validationRepository } from "@/lib/repositories";
import { sendEmail, getDossierReceivedEmailTemplate, getSubmissionCertificateEmailTemplate } from "@/lib/email";

interface DossierStudent {
  id: string;
  dossier_status: string;
  submitted_at: Date | null;
  draft_expires_at: Date | null;
  current_step: number;
  is_complete: boolean;
  documents_count: string;
  first_name: string;
  last_name: string;
  faculty: string;
  study_level: string;
  registration_type: string;
}

// GET - Récupérer le statut du dossier
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'étudiant avec ses documents
    const result = await query<DossierStudent>(
      `SELECT s.id, s.dossier_status, s.submitted_at, s.draft_expires_at,
              s.current_step, s.is_complete, s.first_name, s.last_name,
              s.faculty, s.study_level,
              COUNT(d.id) as documents_count
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN documents d ON d.student_id = s.id
       WHERE u.email = $1
       GROUP BY s.id`,
      [session.user.email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Étudiant non trouvé" }, { status: 404 });
    }

    const student = result.rows[0];
    const now = new Date();
    const draftExpired = student.draft_expires_at ? new Date(student.draft_expires_at) < now : false;

    return NextResponse.json({
      dossierStatus: student.dossier_status,
      submittedAt: student.submitted_at,
      draftExpiresAt: student.draft_expires_at,
      draftExpired,
      currentStep: student.current_step,
      isComplete: student.is_complete,
      documentsCount: parseInt(student.documents_count) || 0,
    });
  } catch (error) {
    console.error("Erreur GET dossier:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Sauvegarder en brouillon ou soumettre
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // "save_draft" ou "submit"

    // Récupérer l'étudiant avec ses documents
    const result = await query<DossierStudent>(
      `SELECT s.id, s.dossier_status, s.submitted_at, s.draft_expires_at,
              s.current_step, s.is_complete, s.first_name, s.last_name,
              s.faculty, s.study_level,
              COUNT(d.id) as documents_count
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN documents d ON d.student_id = s.id
       WHERE u.email = $1
       GROUP BY s.id`,
      [session.user.email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Étudiant non trouvé" }, { status: 404 });
    }

    const student = result.rows[0];

    if (action === "save_draft") {
      // Sauvegarder en brouillon - valide pendant 1 semaine
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await studentRepository.update(student.id, {
        dossierStatus: "DRAFT",
        draftExpiresAt: expiresAt,
      });

      return NextResponse.json({
        success: true,
        message: "Dossier sauvegardé en brouillon",
        draftExpiresAt: expiresAt,
      });
    }

    if (action === "submit") {
      // Vérifier qu'il y a au moins des documents
      if (parseInt(student.documents_count) === 0) {
        return NextResponse.json(
          { error: "Veuillez téléverser au moins un document avant de soumettre" },
          { status: 400 }
        );
      }

      // Soumettre le dossier
      await studentRepository.update(student.id, {
        dossierStatus: "SUBMITTED",
        submittedAt: new Date(),
        currentStep: Math.max(student.current_step, 1),
        draftExpiresAt: null,
      });

      // Créer une entrée de validation pour l'étape 1
      await validationRepository.upsert({
        studentId: student.id,
        step: 1,
        status: "PENDING",
      });

      // Générer un numéro de référence unique (SGR-AAAA-XXXXX)
      const now = new Date();
      const year = now.getFullYear();
      const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      const referenceNumber = `SGR-${year}-${randomPart}`;
      const submissionDate = now.toLocaleDateString("fr-CD", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Envoyer l'email de certificat de soumission
      const facultyName = student.faculty || "Non spécifiée";
      const registrationType = student.registration_type || student.study_level || "Doctorat";
      const certificateTemplate = getSubmissionCertificateEmailTemplate(
        `${student.first_name} ${student.last_name || ""}`.trim(),
        referenceNumber,
        submissionDate,
        registrationType,
        facultyName
      );

      await sendEmail({
        to: session.user.email,
        subject: certificateTemplate.subject,
        html: certificateTemplate.html,
        text: certificateTemplate.text,
      });

      // Envoyer aussi l'email de confirmation de réception
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const dashboardUrl = `${baseUrl}/dashboard`;
      const emailTemplate = getDossierReceivedEmailTemplate(
        student.first_name,
        dashboardUrl
      );

      await sendEmail({
        to: session.user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      return NextResponse.json({
        success: true,
        message: "Dossier soumis avec succès. Un certificat de soumission vous a été envoyé par email.",
        referenceNumber,
      });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    console.error("Erreur POST dossier:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
