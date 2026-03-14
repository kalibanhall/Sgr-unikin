import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * Coordonnées extraites du template Certificat.pdf (US Letter 612x792)
 * 
 * Texte statique du template :
 * - "CERTIFICAT DE VALIDATION..." à x:51, y:633
 * - "Réf. :" à x:51, y:609
 * - "Nom et Prénom :" à x:51, y:535
 * - "Faculté / École / Institut :" à x:51, y:519
 * - "Département :" à x:51, y:504
 * - "Intitulé de la thèse :" à x:51, y:488
 * - "en date du" fin ~x:485, y:414  (date de soumission)
 * - "Fait à Kinshasa, le" à x:430, y:288 (date d'émission)
 */

interface CertificateData {
  referenceNumber: string;
  studentName: string;
  faculty: string;
  department: string;
  thesisTitle: string;
  submissionDate: string; // format: JJ/MM/AAAA
  emissionDate: string;   // format: JJ/MM/AAAA
}

/**
 * Génère un certificat PDF en superposant les données du candidat
 * sur le template officiel Certificat.pdf
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Uint8Array> {
  // Charger le template PDF
  const templatePath = join(process.cwd(), "public", "certificat-template.pdf");
  const templateBytes = await readFile(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  // Embarquer les polices
  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const page = pdfDoc.getPage(0);
  const fontSize = 12;
  const color = rgb(0, 0, 0);

  // --- Masquer "Ministère de l'ESURES" dans l'en-tête ---
  // Couvrir la zone du texte ministériel avec un rectangle blanc
  page.drawRectangle({
    x: 160,
    y: 735,
    width: 300,
    height: 20,
    color: rgb(1, 1, 1), // blanc
  });

  // --- Référence ---
  // "Réf. :" est à x:51 y:609, la valeur va après
  page.drawText(data.referenceNumber, {
    x: 92,
    y: 609,
    size: fontSize,
    font: fontBold,
    color,
  });

  // --- Nom et Prénom ---
  // "Nom et Prénom :" est à x:51 y:535, la valeur après
  page.drawText(data.studentName, {
    x: 170,
    y: 535,
    size: fontSize,
    font: fontBold,
    color,
  });

  // --- Faculté / École / Institut ---
  // Label à x:51 y:519
  page.drawText(data.faculty, {
    x: 228,
    y: 519,
    size: fontSize,
    font: fontRegular,
    color,
  });

  // --- Département ---
  // "Département :" à x:51 y:504
  page.drawText(data.department, {
    x: 148,
    y: 504,
    size: fontSize,
    font: fontRegular,
    color,
  });

  // --- Intitulé de la thèse ---
  // "Intitulé de la thèse :" à x:51 y:488
  // Le titre peut être long, donc on le fait sur plusieurs lignes
  const titleX = 203;
  const titleY = 488;
  const maxWidth = 560 - titleX; // marge droite du document
  const titleLines = wrapText(data.thesisTitle, fontRegular, fontSize, maxWidth);
  
  // Première ligne après le label
  if (titleLines.length > 0) {
    page.drawText(titleLines[0], {
      x: titleX,
      y: titleY,
      size: fontSize,
      font: fontItalic,
      color,
    });
  }
  
  // Lignes suivantes en dessous (interligne de 16pt)
  for (let i = 1; i < titleLines.length; i++) {
    page.drawText(titleLines[i], {
      x: 51,
      y: titleY - (i * 16),
      size: fontSize,
      font: fontItalic,
      color,
    });
  }

  // --- Date de soumission ---
  // "en date du" se termine ~x:485 y:414
  // Les slashes "/" sont à x:495 et x:514 y:414
  // On place la date complète après "en date du "
  page.drawText(data.submissionDate, {
    x: 486,
    y: 414,
    size: fontSize,
    font: fontBold,
    color,
  });

  // --- Date d'émission ---
  // "Fait à Kinshasa, le" est à x:430 y:288
  // Les slashes sont à x:534 et x:552 y:288
  page.drawText(data.emissionDate, {
    x: 533,
    y: 288,
    size: fontSize,
    font: fontBold,
    color,
  });

  // --- Cachet / Stamp ---
  // Superposer l'image du cachet si elle existe
  const stampPath = join(process.cwd(), "public", "stamp.png");
  if (existsSync(stampPath)) {
    const stampBytes = await readFile(stampPath);
    const stampImage = await pdfDoc.embedPng(stampBytes);
    const stampDims = stampImage.scale(0.4);
    page.drawImage(stampImage, {
      x: 400,
      y: 180,
      width: stampDims.width,
      height: stampDims.height,
      opacity: 0.85,
    });
  }

  // Sauvegarder le PDF
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
