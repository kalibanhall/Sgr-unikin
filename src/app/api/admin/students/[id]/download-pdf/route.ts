import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { userRepository, studentRepository, documentRepository } from "@/lib/repositories";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// GET - Générer et télécharger le PDF du dossier
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

    // Récupérer l'étudiant complet
    const result = await query(
      `SELECT s.*, u.email
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Étudiant non trouvé" }, { status: 404 });
    }

    const student = result.rows[0];
    const documents = await documentRepository.findByStudentId(id);

    // Créer le PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { height } = page.getSize();
    let y = height - 50;

    // Titre
    page.drawText("UNIVERSITÉ DE KINSHASA", {
      x: 50,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.12, 0.23, 0.37),
    });
    y -= 25;

    page.drawText("Secrétariat Général à la Recherche", {
      x: 50,
      y,
      size: 14,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 40;

    page.drawText("FICHE D'INSCRIPTION - 3e CYCLE", {
      x: 50,
      y,
      size: 16,
      font: boldFont,
    });
    y -= 40;

    // Informations personnelles
    page.drawText("INFORMATIONS PERSONNELLES", {
      x: 50,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0.12, 0.23, 0.37),
    });
    y -= 20;

    const addField = (label: string, value: string | null) => {
      page.drawText(`${label}: ${value || "Non renseigné"}`, {
        x: 50,
        y,
        size: 10,
        font,
      });
      y -= 15;
    };

    addField("Nom", student.last_name);
    addField("Prénom", student.first_name);
    addField("Email", student.email);
    addField("Téléphone", student.phone);
    addField("Date de naissance", student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString("fr-FR") : null);
    addField("Lieu de naissance", student.place_of_birth);
    addField("Nationalité", student.nationality);
    addField("Genre", student.gender);
    addField("Adresse", student.address);

    y -= 20;

    // Informations académiques
    page.drawText("INFORMATIONS ACADÉMIQUES", {
      x: 50,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0.12, 0.23, 0.37),
    });
    y -= 20;

    addField("Matricule", student.matricule);
    addField("Faculté", student.faculty);
    addField("Département", student.department);
    addField("Niveau d'études", student.study_level);
    addField("Spécialisation", student.specialization);
    addField("Titre de thèse", student.thesis_title);
    addField("Directeur de thèse", student.supervisor);
    addField("Co-directeur", student.co_supervisor);

    y -= 20;

    // Documents
    page.drawText("DOCUMENTS SOUMIS", {
      x: 50,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0.12, 0.23, 0.37),
    });
    y -= 20;

    if (documents.length === 0) {
      page.drawText("Aucun document soumis", { x: 50, y, size: 10, font });
    } else {
      documents.forEach((doc) => {
        page.drawText(`• ${doc.name} (${doc.type})`, { x: 50, y, size: 10, font });
        y -= 15;
      });
    }

    // Pied de page
    page.drawText(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, {
      x: 50,
      y: 30,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="dossier_${student.last_name}_${student.first_name}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur PDF:", error);
    return NextResponse.json({ error: "Erreur génération PDF" }, { status: 500 });
  }
}
