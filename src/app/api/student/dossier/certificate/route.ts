import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { FACULTIES } from "@/lib/constants";
import { generateCertificatePDF } from "@/lib/pdf-certificate";

interface CertificateStudent {
  id: string;
  first_name: string;
  last_name: string;
  faculty: string | null;
  department: string | null;
  study_level: string;
  dossier_type: string | null;
  thesis_title: string | null;
  dossier_status: string;
  submitted_at: Date | null;
  is_complete: boolean;
  validated_at: Date | null;
  reference_number: string | null;
}

// GET - Générer le certificat de validation (HTML imprimable)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'étudiant avec la date de dernière validation
    const result = await query<CertificateStudent>(
      `SELECT s.id, s.first_name, s.last_name, s.faculty, s.department,
              s.study_level, s.dossier_type, s.thesis_title, s.dossier_status, s.submitted_at, s.is_complete,
              s.reference_number,
              (SELECT MAX(v.validated_at) FROM validations v WHERE v.student_id = s.id AND v.status = 'APPROVED') as validated_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE u.email = $1`,
      [session.user.email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Étudiant non trouvé" }, { status: 404 });
    }

    const student = result.rows[0];

    // Le certificat n'est disponible qu'à partir du niveau 1 (dossier soumis)
    if (student.dossier_status === "DRAFT") {
      return NextResponse.json(
        { error: "Le certificat n'est disponible qu'après la soumission de votre dossier." },
        { status: 403 }
      );
    }

    // Résoudre le nom de la faculté
    const facultyEntry = FACULTIES.find(f => f.code === student.faculty);
    const facultyName = facultyEntry?.name || student.faculty || "Non spécifiée";

    const studentName = `${(student.last_name || "").toUpperCase()} ${student.first_name}`;
    const department = student.department || "Non spécifié";
    const thesisTitle = student.thesis_title || "Non spécifié";

    // Formater les dates
    const submissionDate = student.submitted_at
      ? new Date(student.submitted_at).toLocaleDateString("fr-CD", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "N/A";

    const validationDate = student.validated_at
      ? new Date(student.validated_at).toLocaleDateString("fr-CD", { day: "2-digit", month: "2-digit", year: "numeric" })
      : new Date().toLocaleDateString("fr-CD", { day: "2-digit", month: "2-digit", year: "numeric" });

    // Générer le numéro de référence
    const year = student.validated_at
      ? new Date(student.validated_at).getFullYear()
      : new Date().getFullYear();
    const idPart = student.id.replace(/-/g, "").substring(0, 7).toUpperCase();
    // Utiliser le numéro de référence stocké en base, ou un fallback
    const referenceNumber = student.reference_number || `SGR/${idPart}/${year}`;

    // Générer le certificat PDF avec le template approprié
    const pdfBytes = await generateCertificatePDF({
      referenceNumber,
      studentName,
      faculty: facultyName,
      department,
      thesisTitle,
      submissionDate,
      emissionDate: validationDate,
      studyLevel: student.study_level,
      dossierType: student.dossier_type || undefined,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Certificat_${referenceNumber.replace(/\//g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur certificat:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
