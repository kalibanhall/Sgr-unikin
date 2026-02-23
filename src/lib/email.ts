import { Resend } from "resend";

// Initialiser Resend avec la clé API
const getResendClient = () => {
  if (process.env.RESEND_API_KEY) {
    return new Resend(process.env.RESEND_API_KEY);
  }
  return null;
};

interface EmailAttachment {
  filename: string;
  content: Buffer | Uint8Array;
  contentType?: string;
}

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail({ to, subject, html, text, attachments }: SendMailOptions): Promise<boolean> {
  const resend = getResendClient();

  if (!resend) {
    // Mode développement — pas de clé API Resend
    console.log("\n📧 === EMAIL DE DÉVELOPPEMENT (RESEND_API_KEY non configurée) ===");
    console.log(`À: ${to}`);
    console.log(`Sujet: ${subject}`);
    console.log(`Contenu texte: ${text || "(HTML uniquement)"}`);
    if (attachments?.length) {
      console.log(`Pièces jointes: ${attachments.map(a => a.filename).join(", ")}`);
    }
    console.log("================================\n");
    return true;
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || "SGR-UNIKIN <onboarding@resend.dev>";

    const resendAttachments = attachments?.map(a => ({
      filename: a.filename,
      content: Buffer.from(a.content),
    }));

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
      attachments: resendAttachments,
    });

    if (error) {
      console.error("❌ Erreur Resend:", error);
      throw new Error(`Erreur Resend: ${error.message}`);
    }

    console.log(`✅ Email envoyé avec succès à ${to} — ID: ${data?.id}`);
    return true;
  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ Erreur envoi email:");
    console.error("   Destinataire:", to);
    console.error("   Sujet:", subject);
    console.error("   Message:", err.message);
    throw new Error(`Échec de l'envoi de l'email: ${err.message}`);
  }
}

// --- En-tête officielle partagée par tous les emails ---
const baseUrl = process.env.NEXTAUTH_URL || "https://sgr.unikin.ac.cd";

function getEmailHeader(): string {
  return `
    <div style="background: #ffffff; padding: 20px 24px 12px 24px; text-align: center; border-bottom: 3px solid #1e3a5f;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 80px; vertical-align: middle; text-align: left;">
            <img src="${baseUrl}/icons/icon-96x96.png" alt="RDC" style="width: 60px; height: 60px;" />
          </td>
          <td style="vertical-align: middle; text-align: center;">
            <p style="font-size: 9px; color: #555; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
              Ministère de l'Enseignement Supérieur, Universitaire, Recherche Scientifique et Innovations
            </p>
            <h1 style="color: #1e3a5f; margin: 4px 0; font-size: 18px; letter-spacing: 1px; font-family: 'Times New Roman', serif; font-weight: bold;">
              UNIVERSITÉ DE KINSHASA
            </h1>
            <p style="color: #1e3a5f; margin: 2px 0 0 0; font-size: 13px; font-style: italic; font-family: 'Times New Roman', serif;">
              Secrétaire Général chargé de la Recherche UNIKIN
            </p>
          </td>
          <td style="width: 80px; vertical-align: middle; text-align: right;">
            <img src="${baseUrl}/logo-unikin.png" alt="UNIKIN" style="width: 60px; height: 60px;" />
          </td>
        </tr>
      </table>
    </div>`;
}

function getEmailFooter(): string {
  return `
    <div style="background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 11px; margin: 0; font-family: Arial, sans-serif;">
        © ${new Date().getFullYear()} Université de Kinshasa — Secrétariat Général à la Recherche<br>
        Mont Amba, Kinshasa, RDC
      </p>
    </div>`;
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 620px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    ${getEmailHeader()}
    ${content}
    ${getEmailFooter()}
  </div>
</body>
</html>`;
}

// Templates d'emails

export function getVerificationEmailTemplate(name: string, verifyUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Confirmez votre adresse email - SGR-UNIKIN",
    html: emailWrapper(`
      <div style="padding: 32px;">
        <h2 style="color: #1e293b; margin: 0 0 16px 0;">Bienvenue ${name} !</h2>
        <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
          Merci de vous être inscrit sur la plateforme SGR-UNIKIN.
          Pour activer votre compte et accéder à votre espace personnel,
          veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background: #1e3a5f; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Confirmer mon adresse email
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
          Si le bouton ne fonctionne pas, copiez et collez ce lien :<br>
          <a href="${verifyUrl}" style="color: #2563eb; word-break: break-all;">${verifyUrl}</a>
        </p>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">Ce lien expire dans 24 heures.</p>
      </div>
    `),
    text: `Bienvenue ${name} !\n\nConfirmez votre email : ${verifyUrl}\nCe lien expire dans 24 heures.\n\n---\nUniversité de Kinshasa - SGR`,
  };
}

export function getDossierReceivedEmailTemplate(name: string, dashboardUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Votre dossier a été reçu - SGR-UNIKIN",
    html: emailWrapper(`
      <div style="padding: 32px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: #dcfce7; border-radius: 50%; padding: 14px; width: 56px; height: 56px; line-height: 56px;">
            <span style="font-size: 28px;">✅</span>
          </div>
        </div>
        <h2 style="color: #1e293b; margin: 0 0 16px 0; text-align: center;">Dossier bien reçu !</h2>
        <p style="color: #64748b; line-height: 1.6; margin: 0 0 20px 0;">
          Cher(e) ${name},<br><br>
          Nous accusons réception de votre dossier d'inscription au 3e Cycle.
          Votre dossier est maintenant <strong>en cours d'examen</strong> par nos services.
        </p>
        <div style="background: #f0f9ff; border-left: 4px solid #1e3a5f; padding: 14px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #1e40af; margin: 0; font-size: 14px;">
            <strong>Prochaine étape :</strong><br>
            Votre dossier sera examiné par le service académique.
            Vous recevrez un email dès que la validation sera effectuée.
          </p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${dashboardUrl}" style="display: inline-block; background: #1e3a5f; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Suivre mon dossier
          </a>
        </div>
      </div>
    `),
    text: `Cher(e) ${name},\n\nNous accusons réception de votre dossier d'inscription au 3e Cycle.\nSuivez votre dossier : ${dashboardUrl}\n\n---\nUniversité de Kinshasa - SGR`,
  };
}

export function getValidationEmailTemplate(
  name: string,
  status: "approved" | "rejected",
  comment: string | null,
  dashboardUrl: string
): { subject: string; html: string; text: string } {
  const isApproved = status === "approved";

  return {
    subject: isApproved
      ? "Félicitations ! Votre dossier a été validé - SGR-UNIKIN"
      : "Information concernant votre dossier - SGR-UNIKIN",
    html: emailWrapper(`
      <div style="padding: 32px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: ${isApproved ? '#dcfce7' : '#fee2e2'}; border-radius: 50%; padding: 14px; width: 56px; height: 56px; line-height: 56px;">
            <span style="font-size: 28px;">${isApproved ? '✓' : '!'}</span>
          </div>
        </div>
        <h2 style="color: #1e293b; margin: 0 0 16px 0; text-align: center;">
          ${isApproved ? 'Dossier validé !' : 'Action requise sur votre dossier'}
        </h2>
        <p style="color: #64748b; line-height: 1.6; margin: 0 0 20px 0;">
          Cher(e) ${name},<br><br>
          ${isApproved
            ? 'Nous avons le plaisir de vous informer que votre dossier d\'inscription au 3e Cycle a été <strong style="color: #059669;">validé</strong> par notre commission académique.'
            : 'Après examen de votre dossier, certaines corrections sont nécessaires.'
          }
        </p>
        ${comment ? `
        <div style="background: ${isApproved ? '#f0fdf4' : '#fef2f2'}; border-left: 4px solid ${isApproved ? '#22c55e' : '#ef4444'}; padding: 14px; margin: 20px 0; border-radius: 4px;">
          <p style="color: ${isApproved ? '#166534' : '#991b1b'}; margin: 0; font-size: 14px;">
            <strong>Commentaire :</strong><br>${comment}
          </p>
        </div>` : ''}
        ${isApproved ? `
        <div style="background: #f0f9ff; padding: 18px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 15px;">Prochaines étapes :</h3>
          <ul style="color: #64748b; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Conservez cet email comme preuve de validation</li>
            <li>Connectez-vous pour télécharger votre attestation</li>
            <li>Suivez les instructions pour finaliser votre inscription</li>
          </ul>
        </div>` : `
        <div style="background: #fef2f2; padding: 18px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #991b1b; margin: 0 0 10px 0; font-size: 15px;">Actions requises :</h3>
          <ul style="color: #64748b; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Connectez-vous à votre espace</li>
            <li>Corrigez les éléments mentionnés</li>
            <li>Soumettez à nouveau votre dossier</li>
          </ul>
        </div>`}
        <div style="text-align: center; margin: 28px 0;">
          <a href="${dashboardUrl}" style="display: inline-block; background: ${isApproved ? '#059669' : '#1e3a5f'}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            ${isApproved ? 'Accéder à mon espace' : 'Corriger mon dossier'}
          </a>
        </div>
      </div>
    `),
    text: `Cher(e) ${name},\n\n${isApproved ? 'Votre dossier a été VALIDÉ.' : 'Des corrections sont nécessaires.'}\n${comment ? 'Commentaire : ' + comment : ''}\n\n${dashboardUrl}\n\n---\nUniversité de Kinshasa - SGR`,
  };
}

export function getPasswordResetEmailTemplate(name: string, resetUrl: string) {
  return {
    subject: 'Réinitialisation de votre mot de passe - SGR UNIKIN',
    html: emailWrapper(`
      <div style="padding: 32px;">
        <h2 style="color: #1e293b; margin: 0 0 16px 0; text-align: center;">Réinitialisation de mot de passe</h2>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
          Bonjour <strong>${name}</strong>,
        </p>
        <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
          Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 4px; margin: 20px 0;">
          <p style="color: #92400e; font-size: 13px; margin: 0;">
            ⚠️ Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
          </p>
        </div>
        <p style="color: #777; font-size: 12px; line-height: 1.6; margin: 0;">
          Lien alternatif :<br>
          <a href="${resetUrl}" style="color: #1e3a5f; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
    `),
    text: `Bonjour ${name},\n\nRéinitialisez votre mot de passe : ${resetUrl}\nCe lien expire dans 1 heure.\n\n---\nUniversité de Kinshasa - SGR`,
  };
}

export function getContactEmailTemplate(senderName: string, senderEmail: string, subject: string, message: string): { subject: string; html: string; text: string } {
  return {
    subject: `[Contact SGR-UNIKIN] ${subject}`,
    html: emailWrapper(`
      <div style="padding: 28px;">
        <h2 style="color: #1e293b; margin: 0 0 16px 0; text-align: center;">Nouveau message de contact</h2>
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 18px; margin-bottom: 18px;">
          <p style="color: #334155; margin: 0 0 6px 0;"><strong>De :</strong> ${senderName}</p>
          <p style="color: #334155; margin: 0 0 6px 0;"><strong>Email :</strong> <a href="mailto:${senderEmail}" style="color: #2563eb;">${senderEmail}</a></p>
          <p style="color: #334155; margin: 0;"><strong>Sujet :</strong> ${subject}</p>
        </div>
        <h3 style="color: #1e293b; margin: 0 0 10px 0; font-size: 15px;">Message :</h3>
        <div style="color: #475569; line-height: 1.7; white-space: pre-wrap; background: #fafafa; padding: 18px; border-radius: 8px; border: 1px solid #e2e8f0;">${message}</div>
      </div>
    `),
    text: `Nouveau message de contact\n\nDe : ${senderName}\nEmail : ${senderEmail}\nSujet : ${subject}\n\nMessage :\n${message}`,
  };
}

// Template email pour le certificat de validation (avec PDF en pièce jointe)
export function getValidationCertificateEmailTemplate(
  studentName: string,
  referenceNumber: string,
  validationDate: string,
): { subject: string; html: string; text: string } {
  return {
    subject: `Certificat de validation de dossier N° ${referenceNumber} - SGR UNIKIN`,
    html: emailWrapper(`
      <div style="padding: 32px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; background: #dcfce7; border-radius: 50%; padding: 14px; width: 56px; height: 56px; line-height: 56px;">
            <span style="font-size: 28px;">🎓</span>
          </div>
        </div>
        <h2 style="color: #1e293b; margin: 0 0 16px 0; text-align: center;">Dossier de thèse validé !</h2>
        <p style="color: #64748b; line-height: 1.6; margin: 0 0 20px 0;">
          Cher(e) <strong>${studentName}</strong>,<br><br>
          Le Secrétariat Général à la Recherche de l'Université de Kinshasa a le plaisir de vous informer que
          votre dossier de thèse a été <strong style="color: #059669;">validé et déclaré complet</strong>.
        </p>
        <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 18px; margin: 20px 0; text-align: center;">
          <p style="color: #166534; margin: 0 0 4px 0; font-size: 15px;">
            <strong>Certificat de validation N° ${referenceNumber}</strong>
          </p>
          <p style="color: #166534; margin: 0; font-size: 13px;">
            Date de validation : ${validationDate}
          </p>
        </div>
        <div style="background: #f0f9ff; border-left: 4px solid #1e3a5f; padding: 14px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #1e40af; margin: 0; font-size: 14px;">
            <strong>📎 Pièce jointe :</strong> Votre certificat officiel de validation de dossier de thèse est joint à cet email au format PDF.
            Veuillez le conserver précieusement.
          </p>
        </div>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
          En foi de quoi, le présent certificat est délivré pour servir et valoir ce que de droit.
        </p>
      </div>
    `),
    text: `Cher(e) ${studentName},\n\nVotre dossier de thèse a été validé et déclaré complet.\nCertificat N° ${referenceNumber} — Date : ${validationDate}\n\nLe certificat PDF officiel est joint à cet email.\n\n---\nUniversité de Kinshasa - SGR`,
  };
}

export function getSubmissionCertificateEmailTemplate(
  name: string,
  referenceNumber: string,
  submissionDate: string,
  registrationType: string,
  faculty: string
): { subject: string; html: string; text: string } {
  return {
    subject: `Certificat de soumission de dossier N° ${referenceNumber} - SGR UNIKIN`,
    html: emailWrapper(`
      <div style="padding: 32px;">
        <h2 style="color: #1e293b; margin: 0 0 16px 0; text-align: center;">Certificat de soumission</h2>
        <p style="color: #333; font-size: 15px; line-height: 1.6;">
          Bonjour <strong>${name}</strong>,
        </p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Nous accusons réception de votre dossier soumis en ligne. Voici les détails :
        </p>
        <div style="background-color: #f0f9ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 18px; margin: 18px 0;">
          <p style="color: #1e40af; margin: 0 0 6px 0; font-size: 17px;"><strong>N° ${referenceNumber}</strong></p>
          <p style="color: #334155; margin: 0 0 4px 0;"><strong>Date :</strong> ${submissionDate}</p>
          <p style="color: #334155; margin: 0 0 4px 0;"><strong>Type :</strong> ${registrationType}</p>
          <p style="color: #334155; margin: 0;"><strong>Faculté :</strong> ${faculty}</p>
        </div>
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 4px; margin: 18px 0;">
          <p style="color: #92400e; font-size: 13px; margin: 0;">
            <strong>Prochaine étape :</strong> Imprimez ce certificat et déposez-le à votre faculté avec votre dossier physique.
          </p>
        </div>
        <p style="color: #555; font-size: 13px;">
          <strong>Délai moyen :</strong> 5 jours ouvrables après réception du dossier physique.
        </p>
      </div>
    `),
    text: `N° ${referenceNumber}\nDate : ${submissionDate}\nCandidat : ${name}\nType : ${registrationType}\nFaculté : ${faculty}\n\nImprimez et déposez à votre faculté.\n\n---\nUniversité de Kinshasa - SGR`,
  };
}
