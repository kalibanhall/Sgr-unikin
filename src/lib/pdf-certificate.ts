import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * 3 templates de certificat (US Letter 612x792) :
 * - certificat-inscription-these.pdf    → DOCTORAT + INSCRIPTION
 * - certificat-soutenance-these.pdf     → DOCTORAT + SOUTENANCE
 * - certificat-soutenance-dea.pdf       → MASTER + (tout type)
 *
 * Champs dynamiques à remplir :
 * Nom et Prénom, Faculté, Département, Intitulé, Date soumission, Date émission
 */

interface CertificateData {
  referenceNumber: string;
  studentName: string;
  faculty: string;
  department: string;
  thesisTitle: string;
  submissionDate: string; // format: JJ/MM/AAAA
  emissionDate: string;   // format: JJ/MM/AAAA
  studyLevel?: string;    // MASTER | DOCTORAT
  dossierType?: string;   // INSCRIPTION | SOUTENANCE | AUTRE
}

// Coordonnées des champs pour chaque template
interface TemplateCoords {
  file: string;
  reference: { x: number; y: number; maskX: number; maskWidth: number; maskHeight: number };
  name: { x: number; y: number };
  faculty: { x: number; y: number };
  department: { x: number; y: number };
  thesis: { x: number; y: number };
  submissionDate: { x: number; y: number; maskX: number; maskWidth: number };
  emissionDate: { x: number; y: number; maskX: number; maskWidth: number };
}

const TEMPLATES: Record<string, TemplateCoords> = {
  // DOCTORAT + INSCRIPTION
  "inscription-these": {
    file: "certificat-inscription-these.pdf",
    reference:      { x: 51.275, y: 583.92, maskX: 50, maskWidth: 140, maskHeight: 16 },
    name:           { x: 175, y: 511 },
    faculty:        { x: 137, y: 495 },
    department:     { x: 150, y: 479 },
    thesis:         { x: 157, y: 463 },
    submissionDate: { x: 481, y: 389, maskX: 476, maskWidth: 62 },
    emissionDate:   { x: 518, y: 263, maskX: 514, maskWidth: 56 },
  },
  // DOCTORAT + SOUTENANCE
  "soutenance-these": {
    file: "certificat-soutenance-these.pdf",
    reference:      { x: 51.275, y: 583.92, maskX: 50, maskWidth: 140, maskHeight: 16 },
    name:           { x: 175, y: 511 },
    faculty:        { x: 137, y: 495 },
    department:     { x: 150, y: 479 },
    thesis:         { x: 157, y: 463 },
    submissionDate: { x: 481, y: 389, maskX: 476, maskWidth: 68 },
    emissionDate:   { x: 521, y: 263, maskX: 517, maskWidth: 56 },
  },
  // MASTER (DEA/DES) — tout type
  "soutenance-dea": {
    file: "certificat-soutenance-dea.pdf",
    reference:      { x: 51.275, y: 585.42, maskX: 50, maskWidth: 140, maskHeight: 16 },
    name:           { x: 175, y: 512 },
    faculty:        { x: 137, y: 496 },
    department:     { x: 150, y: 480 },
    thesis:         { x: 154, y: 464 },
    submissionDate: { x: 478, y: 390, maskX: 474, maskWidth: 76 },
    emissionDate:   { x: 524, y: 265, maskX: 520, maskWidth: 56 },
  },
};

/**
 * Détermine quel template utiliser selon le niveau d'études et le type de dossier
 */
function getTemplateKey(studyLevel?: string, dossierType?: string): string {
  if (studyLevel === "MASTER") {
    return "soutenance-dea";
  }
  if (dossierType === "SOUTENANCE") {
    return "soutenance-these";
  }
  return "inscription-these";
}

/**
 * Génère un certificat PDF en superposant les données du candidat
 * sur le template officiel approprié
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Uint8Array> {
  const templateKey = getTemplateKey(data.studyLevel, data.dossierType);
  const coords = TEMPLATES[templateKey];

  const templatePath = join(process.cwd(), "public", coords.file);
  const templateBytes = await readFile(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const page = pdfDoc.getPage(0);
  const fontSize = 11;
  const color = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);

  // --- Numéro de référence ---
  if (data.referenceNumber) {
    page.drawRectangle({
      x: coords.reference.maskX,
      y: coords.reference.y - 4,
      width: coords.reference.maskWidth,
      height: coords.reference.maskHeight,
      color: white,
    });
    page.drawText(`Réf. : ${data.referenceNumber}`, {
      x: coords.reference.x,
      y: coords.reference.y,
      size: 9,
      font: fontRegular,
      color,
    });
  }

  // --- Nom et Prénom ---
  page.drawText(data.studentName, {
    x: coords.name.x,
    y: coords.name.y,
    size: fontSize,
    font: fontBold,
    color,
  });

  // --- Faculté / École ---
  page.drawText(data.faculty, {
    x: coords.faculty.x,
    y: coords.faculty.y,
    size: fontSize,
    font: fontRegular,
    color,
  });

  // --- Département ---
  page.drawText(data.department, {
    x: coords.department.x,
    y: coords.department.y,
    size: fontSize,
    font: fontRegular,
    color,
  });

  // --- Intitulé de la thèse / du travail ---
  const titleX = coords.thesis.x;
  const titleY = coords.thesis.y;
  const maxWidth = 560 - titleX;
  const titleLines = wrapText(data.thesisTitle, fontRegular, fontSize, maxWidth);
  
  if (titleLines.length > 0) {
    page.drawText(titleLines[0], {
      x: titleX,
      y: titleY,
      size: fontSize,
      font: fontItalic,
      color,
    });
  }
  for (let i = 1; i < titleLines.length; i++) {
    page.drawText(titleLines[i], {
      x: 51,
      y: titleY - (i * 15),
      size: fontSize,
      font: fontItalic,
      color,
    });
  }

  // --- Date de soumission ---
  // Masquer les emplacements de date vides (espaces + /) puis écrire la date
  page.drawRectangle({
    x: coords.submissionDate.maskX,
    y: coords.submissionDate.y - 4,
    width: coords.submissionDate.maskWidth,
    height: 16,
    color: white,
  });
  page.drawText(data.submissionDate, {
    x: coords.submissionDate.x,
    y: coords.submissionDate.y,
    size: fontSize,
    font: fontBold,
    color,
  });

  // --- Date d'émission (Fait à Kinshasa, le ...) ---
  page.drawRectangle({
    x: coords.emissionDate.maskX,
    y: coords.emissionDate.y - 4,
    width: coords.emissionDate.maskWidth,
    height: 16,
    color: white,
  });
  page.drawText(data.emissionDate, {
    x: coords.emissionDate.x,
    y: coords.emissionDate.y,
    size: fontSize,
    font: fontBold,
    color,
  });

  // --- Cachet / Stamp ---
  const stampPath = join(process.cwd(), "public", "stamp.png");
  if (existsSync(stampPath)) {
    const stampBytes = await readFile(stampPath);
    const stampImage = await pdfDoc.embedPng(stampBytes);
    const stampDims = stampImage.scale(0.4);
    page.drawImage(stampImage, {
      x: 400,
      y: 150,
      width: stampDims.width,
      height: stampDims.height,
      opacity: 0.85,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Découpe un texte en lignes en fonction de la largeur maximale
 */
function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
