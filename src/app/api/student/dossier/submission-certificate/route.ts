import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { FACULTIES } from "@/lib/constants";
import { readFile } from "fs/promises";
import { join } from "path";

interface SubmissionStudent {
  id: string;
  first_name: string;
  last_name: string;
  faculty: string | null;
  department: string | null;
  study_level: string;
  thesis_title: string | null;
  dossier_status: string;
  submitted_at: Date | null;
}

// GET - Générer le certificat de soumission (HTML imprimable)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'étudiant
    const result = await query<SubmissionStudent>(
      `SELECT s.id, s.first_name, s.last_name, s.faculty, s.department,
              s.study_level, s.thesis_title, s.dossier_status, s.submitted_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE u.email = $1`,
      [session.user.email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Étudiant non trouvé" }, { status: 404 });
    }

    const student = result.rows[0];

    // Le certificat de soumission est disponible dès que le dossier est soumis
    if (student.dossier_status === "DRAFT") {
      return NextResponse.json(
        { error: "Le certificat de soumission n'est disponible qu'après la soumission du dossier." },
        { status: 403 }
      );
    }

    // Résoudre le nom de la faculté
    const facultyEntry = FACULTIES.find(f => f.code === student.faculty);
    const facultyName = facultyEntry?.name || student.faculty || "Non spécifiée";

    const studentName = `${(student.last_name || "").toUpperCase()} ${student.first_name}`;
    const department = student.department || "Non spécifié";
    const thesisTitle = student.thesis_title || "Non spécifié";

    // Formater la date de soumission
    const submissionDate = student.submitted_at
      ? new Date(student.submitted_at).toLocaleDateString("fr-CD", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

    // Générer le numéro de référence basé sur l'ID étudiant et l'année
    const year = student.submitted_at
      ? new Date(student.submitted_at).getFullYear()
      : new Date().getFullYear();
    const idPart = student.id.replace(/-/g, "").substring(0, 7).toUpperCase();
    const referenceNumber = `SGR-${year}-${idPart}`;

    // Lire les images en base64
    let cachetBase64 = "";
    try {
      const cachetPath = join(process.cwd(), "public", "cachet-sgr.png");
      const cachetBuffer = await readFile(cachetPath);
      cachetBase64 = cachetBuffer.toString("base64");
    } catch {
      console.warn("Cachet SGR non trouvé");
    }

    // Générer le HTML imprimable
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificat de Soumission - ${studentName} - SGR UNIKIN</title>
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
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 0;
      padding: 10px 20px;
      border: 2px solid #f59e0b;
      display: inline-block;
      background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
      color: #92400e;
    }
    .reference {
      text-align: center;
      font-size: 14px;
      margin: 15px 0 30px 0;
      color: #555;
    }
    .reference strong {
      color: #1e3a5f;
      font-size: 16px;
    }
    .corps {
      text-align: justify;
      margin: 20px 0;
      font-size: 14px;
    }
    .corps p {
      margin: 15px 0;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #1e3a5f;
      padding: 15px 20px;
      margin: 25px 0;
    }
    .info-box table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-box td {
      padding: 8px 0;
      vertical-align: top;
    }
    .info-box td:first-child {
      width: 150px;
      font-weight: bold;
      color: #1e3a5f;
    }
    .note {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 4px;
      padding: 15px;
      margin: 25px 0;
      font-size: 13px;
    }
    .note strong {
      color: #92400e;
    }
    .signature {
      margin-top: 40px;
      text-align: right;
      padding-right: 30px;
    }
    .signature .lieu-date {
      font-size: 14px;
      margin-bottom: 10px;
    }
    .signature .poste {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .cachet {
      position: relative;
      height: 100px;
      margin-top: 10px;
    }
    .cachet img {
      height: 90px;
      opacity: 0.9;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 11px;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
    .print-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1e3a5f;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .print-btn:hover {
      background: #0f2744;
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer</button>

  <div class="header">
    <p class="universite">UNIVERSITÉ DE KINSHASA</p>
    <p class="sgr">Secrétariat Général chargé de la Recherche</p>
  </div>

  <div class="titre">
    <h2>Certificat de Soumission de Dossier</h2>
  </div>

  <div class="reference">
    Référence : <strong>${referenceNumber}</strong>
  </div>

  <div class="corps">
    <p>
      Le Secrétariat Général chargé de la Recherche de l'Université de Kinshasa
      accuse réception du dossier d'inscription au troisième cycle soumis par :
    </p>

    <div class="info-box">
      <table>
        <tr>
          <td>Candidat :</td>
          <td><strong>${studentName}</strong></td>
        </tr>
        <tr>
          <td>Faculté :</td>
          <td>${facultyName}</td>
        </tr>
        <tr>
          <td>Département :</td>
          <td>${department}</td>
        </tr>
        <tr>
          <td>Niveau d'études :</td>
          <td>${student.study_level || "Doctorat"}</td>
        </tr>
        <tr>
          <td>${student.study_level === "DOCTORAT" ? "Sujet de thèse" : "Sujet du mémoire"} :</td>
          <td>${thesisTitle}</td>
        </tr>
        <tr>
          <td>Date de soumission :</td>
          <td>${submissionDate}</td>
        </tr>
      </table>
    </div>

    <div class="note">
      <strong>📌 Prochaine étape :</strong><br>
      Imprimez ce certificat et déposez-le à votre faculté avec votre dossier physique complet.
      La faculté transmettra ensuite votre dossier au Secrétariat Général à la Recherche pour traitement.
      <br><br>
      <strong>Délai moyen de traitement :</strong> 5 jours ouvrables après réception du dossier physique.
    </div>

    <p>
      En foi de quoi, le présent certificat de soumission est délivré à l'intéressé(e) 
      pour servir et valoir ce que de droit.
    </p>
  </div>

  <div class="signature">
    <p class="lieu-date">Kinshasa, le ${new Date().toLocaleDateString("fr-CD", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}</p>
    <p class="poste">Le Secrétaire Général à la Recherche</p>
    ${cachetBase64 ? `<div class="cachet"><img src="data:image/png;base64,${cachetBase64}" alt="Cachet SGR" /></div>` : ""}
  </div>

  <div class="footer">
    Document généré automatiquement par le système SGR-UNIKIN<br>
    Université de Kinshasa — Mont Amba, Kinshasa, RDC<br>
    <em>Ce document peut être vérifié en ligne sur sgr.unikin.ac.cd</em>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Erreur génération certificat soumission:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
