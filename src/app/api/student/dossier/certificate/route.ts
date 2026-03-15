import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { FACULTIES } from "@/lib/constants";
import { readFile } from "fs/promises";
import { join } from "path";

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

    // Le certificat est disponible après la première validation (étape 1 approuvée)
    const stepResult = await query<{ current_step: number }>(
      `SELECT current_step FROM students WHERE id = $1`,
      [student.id]
    );
    const currentStep = stepResult.rows[0]?.current_step ?? 0;
    if (currentStep < 2 && student.dossier_status !== "VALIDATED" && student.dossier_status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Le certificat n'est disponible qu'après la première validation du dossier." },
        { status: 403 }
      );
    }

    // Résoudre le nom de la faculté
    const facultyEntry = FACULTIES.find(f => f.code === student.faculty);
    const facultyName = facultyEntry?.name || student.faculty || "Non spécifiée";

    const studentName = `${(student.last_name || "").toUpperCase()} ${student.first_name}`;
    const department = student.department || "Non spécifié";
    const thesisTitle = student.thesis_title || "Non spécifié";

    // Adapter le libellé selon le niveau d'études
    const isDoctorat = student.study_level === "DOCTORAT";
    const dossierLabel = isDoctorat ? "Thèse" : "Mémoire (DEA/DES)";
    const intituleLabel = isDoctorat ? "Intitulé de la thèse" : "Intitulé du mémoire";
    const dossierDeLabel = isDoctorat ? "dossier de thèse" : "dossier de mémoire (DEA/DES)";

    // Formater les dates
    const submissionDate = student.submitted_at
      ? new Date(student.submitted_at).toLocaleDateString("fr-CD", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "N/A";

    const validationDate = student.validated_at
      ? new Date(student.validated_at).toLocaleDateString("fr-CD", { day: "2-digit", month: "2-digit", year: "numeric" })
      : new Date().toLocaleDateString("fr-CD", { day: "2-digit", month: "2-digit", year: "numeric" });

    // Générer le numéro de référence basé sur l'ID étudiant et l'année
    const year = student.validated_at
      ? new Date(student.validated_at).getFullYear()
      : new Date().getFullYear();
    // Utiliser les 7 premiers caractères de l'ID pour généer un numéro unique
    const idPart = student.id.replace(/-/g, "").substring(0, 7).toUpperCase();
    const referenceNumber = `SGR/${idPart}/${year}`;

    // Lire le cachet SGR en base64 pour l'intégrer directement dans le HTML
    let cachetBase64 = "";
    try {
      const cachetPath = join(process.cwd(), "public", "cachet-sgr.png");
      const cachetBuffer = await readFile(cachetPath);
      cachetBase64 = cachetBuffer.toString("base64");
    } catch {
      console.warn("Cachet SGR non trouvé dans public/cachet-sgr.png");
    }

    // Générer le HTML imprimable
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificat de Validation - ${studentName} - SGR UNIKIN</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
      @page { size: A4; margin: 20mm; }
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      color: #1a1a1a;
      background: #fff;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #1e3a5f;
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    .header-logos {
      margin-bottom: 10px;
    }
    .header-logos .logo {
      height: 80px;
      width: auto;
    }
    .header .ministere {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 5px 0;
      color: #333;
    }
    .header .universite {
      font-size: 22px;
      font-weight: bold;
      color: #1e3a5f;
      margin: 5px 0;
      letter-spacing: 2px;
    }
    .header .sgr {
      font-size: 15px;
      font-style: italic;
      color: #1e3a5f;
      margin: 5px 0;
    }
    .titre {
      text-align: center;
      margin: 30px 0 20px 0;
    }
    .titre h2 {
      font-size: 17px;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-decoration: underline;
      color: #1e3a5f;
      margin: 0 0 10px 0;
    }
    .titre .ref {
      font-size: 14px;
      color: #555;
    }
    .corps {
      font-size: 15px;
      line-height: 2;
      margin: 20px 10px;
    }
    .infos {
      margin: 15px 0 15px 30px;
    }
    .infos p {
      margin: 6px 0;
    }
    .signature {
      position: relative;
      text-align: right;
      margin-top: 50px;
      padding-right: 20px;
    }
    .signature .date {
      font-size: 14px;
    }
    .signature .titre-sig {
      font-size: 14px;
      color: #1e3a5f;
      font-weight: bold;
      margin-top: 15px;
    }
    .cachet-container {
      position: relative;
      display: inline-block;
      margin-top: 10px;
    }
    .cachet-container .cachet {
      width: 150px;
      height: 150px;
      opacity: 0.85;
    }
    .print-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #1e3a5f;
      color: #fff;
      border: none;
      padding: 14px 28px;
      font-size: 16px;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 100;
    }
    .print-btn:hover { background: #2d5a87; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer le certificat</button>

  <div class="header">
    <div class="header-logos">
      <img src="/logo-unikin.png" alt="UNIKIN" class="logo" />
    </div>
    <p class="universite">UNIVERSITÉ DE KINSHASA</p>
    <p class="sgr">Secrétaire Général chargé de la Recherche UNIKIN</p>
  </div>

  <div class="titre">
    <h2>Certificat de Validation de Dossier de ${dossierLabel}</h2>
    <p class="ref">Réf. : <strong>${referenceNumber}</strong></p>
  </div>

  <div class="corps">
    <p>Le Secrétariat Général à la Recherche de l'Université de Kinshasa certifie par la présente que le ${dossierDeLabel} de :</p>

    <div class="infos">
      <p><strong>Nom et Prénom :</strong> ${studentName}</p>
      <p><strong>Faculté / École / Institut :</strong> ${facultyName}</p>
      <p><strong>Département :</strong> ${department}</p>
      <p><strong>${intituleLabel} :</strong> ${thesisTitle}</p>
    </div>

    <p>a été soumis via la plateforme officielle du Secrétariat Général à la Recherche en date du ${submissionDate}.</p>

    <p>Après vérification de la conformité administrative et académique des pièces requises, le dossier est déclaré <strong>Complet</strong>.</p>

    <p>En foi de quoi, le présent certificat est délivré pour servir et valoir ce que de droit.</p>
  </div>

  <div class="signature">
    <p class="date">Fait à Kinshasa, le ${validationDate}</p>
    <p class="titre-sig">Le Secrétaire Général à la Recherche</p>
    ${cachetBase64 ? `<div class="cachet-container"><img src="data:image/png;base64,${cachetBase64}" alt="Cachet SGR UNIKIN" class="cachet" /></div>` : ""}
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Erreur certificat:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
