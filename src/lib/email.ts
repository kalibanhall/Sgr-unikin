import nodemailer from "nodemailer";

// Configuration du transporteur email
// En développement, on utilise un service de test (Ethereal)
// En production, configurez avec vos vrais identifiants SMTP
const createTransporter = () => {
  // Utiliser les variables d'environnement pour la configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // Mode développement - utiliser Ethereal ou console log
  console.log("⚠️ Email en mode développement - les emails seront logués dans la console");
  return null;
};

const transporter = createTransporter();

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendMailOptions): Promise<boolean> {
  try {
    if (!transporter) {
      // En mode développement, logger l'email
      console.log("\n📧 === EMAIL DE DÉVELOPPEMENT ===");
      console.log(`À: ${to}`);
      console.log(`Sujet: ${subject}`);
      console.log(`Contenu: ${text || html}`);
      console.log("================================\n");
      return true;
    }

    const info = await transporter.sendMail({
      from: `"SGR-UNIKIN" <${process.env.SMTP_FROM || "noreply@unikin.cd"}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });

    console.log("Email envoyé:", info.messageId);
    return true;
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return false;
  }
}

// Templates d'emails

export function getVerificationEmailTemplate(name: string, verifyUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Confirmez votre adresse email - SGR-UNIKIN",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">SGR-UNIKIN</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Secrétariat Général à la Recherche</p>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #1e293b; margin: 0 0 16px 0;">Bienvenue ${name} !</h2>
            <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
              Merci de vous être inscrit sur la plateforme SGR-UNIKIN. 
              Pour activer votre compte et accéder à votre espace personnel, 
              veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Confirmer mon adresse email
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
              <a href="${verifyUrl}" style="color: #2563eb; word-break: break-all;">${verifyUrl}</a>
            </p>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 24px;">
              Ce lien expire dans 24 heures.
            </p>
          </div>
          <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Université de Kinshasa - Secrétariat Général à la Recherche<br>
              Mont Amba, Kinshasa, RDC
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Bienvenue ${name} !

Merci de vous être inscrit sur la plateforme SGR-UNIKIN.
Pour activer votre compte, veuillez confirmer votre adresse email en visitant ce lien :

${verifyUrl}

Ce lien expire dans 24 heures.

---
Université de Kinshasa - Secrétariat Général à la Recherche
    `,
  };
}

export function getDossierReceivedEmailTemplate(name: string, dashboardUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Votre dossier a été reçu - SGR-UNIKIN",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">SGR-UNIKIN</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Secrétariat Général à la Recherche</p>
          </div>
          <div style="padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: #dcfce7; border-radius: 50%; padding: 16px;">
                <span style="font-size: 32px;">✅</span>
              </div>
            </div>
            <h2 style="color: #1e293b; margin: 0 0 16px 0; text-align: center;">Dossier bien reçu !</h2>
            <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
              Cher(e) ${name},<br><br>
              Nous accusons réception de votre dossier d'inscription au 3e Cycle. 
              Votre dossier est maintenant <strong>en cours d'examen</strong> par nos services.
            </p>
            <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="color: #1e40af; margin: 0; font-size: 14px;">
                <strong>Prochaine étape :</strong><br>
                Votre dossier sera examiné par le service académique. 
                Vous recevrez un email dès que la validation sera effectuée.
              </p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Suivre mon dossier
              </a>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Université de Kinshasa - Secrétariat Général à la Recherche<br>
              Mont Amba, Kinshasa, RDC
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Cher(e) ${name},

Nous accusons réception de votre dossier d'inscription au 3e Cycle.
Votre dossier est maintenant en cours d'examen par nos services.

Prochaine étape :
Votre dossier sera examiné par le service académique.
Vous recevrez un email dès que la validation sera effectuée.

Suivez l'état de votre dossier : ${dashboardUrl}

---
Université de Kinshasa - Secrétariat Général à la Recherche
    `,
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
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, ${isApproved ? '#059669' : '#dc2626'} 0%, ${isApproved ? '#10b981' : '#ef4444'} 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">SGR-UNIKIN</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Secrétariat Général à la Recherche</p>
          </div>
          <div style="padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: ${isApproved ? '#dcfce7' : '#fee2e2'}; border-radius: 50%; padding: 16px;">
                <span style="font-size: 32px;">${isApproved ? '🎉' : '⚠️'}</span>
              </div>
            </div>
            <h2 style="color: #1e293b; margin: 0 0 16px 0; text-align: center;">
              ${isApproved ? 'Dossier validé !' : 'Action requise sur votre dossier'}
            </h2>
            <p style="color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
              Cher(e) ${name},<br><br>
              ${isApproved 
                ? 'Nous avons le plaisir de vous informer que votre dossier d\'inscription au 3e Cycle a été <strong style="color: #059669;">validé</strong> par notre commission académique.'
                : 'Après examen de votre dossier d\'inscription au 3e Cycle, nous devons vous informer que certaines corrections sont nécessaires.'
              }
            </p>
            ${comment ? `
            <div style="background: ${isApproved ? '#f0fdf4' : '#fef2f2'}; border-left: 4px solid ${isApproved ? '#22c55e' : '#ef4444'}; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="color: ${isApproved ? '#166534' : '#991b1b'}; margin: 0; font-size: 14px;">
                <strong>Commentaire :</strong><br>
                ${comment}
              </p>
            </div>
            ` : ''}
            ${isApproved ? `
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">Prochaines étapes :</h3>
              <ul style="color: #64748b; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Conservez cet email comme preuve de validation</li>
                <li>Connectez-vous pour télécharger votre attestation</li>
                <li>Suivez les instructions pour finaliser votre inscription</li>
              </ul>
            </div>
            ` : `
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h3 style="color: #991b1b; margin: 0 0 12px 0; font-size: 16px;">Actions requises :</h3>
              <ul style="color: #64748b; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Connectez-vous à votre espace</li>
                <li>Corrigez les éléments mentionnés</li>
                <li>Soumettez à nouveau votre dossier</li>
              </ul>
            </div>
            `}
            <div style="text-align: center; margin: 32px 0;">
              <a href="${dashboardUrl}" style="display: inline-block; background: ${isApproved ? '#059669' : '#2563eb'}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                ${isApproved ? 'Accéder à mon espace' : 'Corriger mon dossier'}
              </a>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Université de Kinshasa - Secrétariat Général à la Recherche<br>
              Mont Amba, Kinshasa, RDC
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Cher(e) ${name},

${isApproved 
  ? 'Nous avons le plaisir de vous informer que votre dossier d\'inscription au 3e Cycle a été VALIDÉ par notre commission académique.'
  : 'Après examen de votre dossier d\'inscription au 3e Cycle, nous devons vous informer que certaines corrections sont nécessaires.'
}

${comment ? `Commentaire : ${comment}` : ''}

Accédez à votre espace : ${dashboardUrl}

---
Université de Kinshasa - Secrétariat Général à la Recherche
    `,
  };
}

// Template d'email pour réinitialisation de mot de passe
export function getPasswordResetEmailTemplate(name: string, resetUrl: string) {
  return {
    subject: 'Réinitialisation de votre mot de passe - SGR UNIKIN',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de mot de passe</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                🔐 Réinitialisation de mot de passe
              </h1>
              <p style="color: #93c5fd; margin: 10px 0 0 0; font-size: 14px;">
                SGR UNIKIN - Secrétariat Général à la Recherche
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Bonjour <strong>${name}</strong>,
              </p>
              
              <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                Vous avez demandé la réinitialisation de votre mot de passe pour votre compte SGR UNIKIN.
              </p>
              
              <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto 30px auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 8px; text-align: center;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                      Réinitialiser mon mot de passe
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Warning -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  ⚠️ Ce lien expirera dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                </p>
              </div>
              
              <!-- Alternative Link -->
              <p style="color: #777; font-size: 13px; line-height: 1.6; margin: 0;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                <a href="${resetUrl}" style="color: #1e3a5f; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 30px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                © 2025 Université de Kinshasa - Secrétariat Général à la Recherche<br>
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Bonjour ${name},

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte SGR UNIKIN.

Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :
${resetUrl}

⚠️ Ce lien expirera dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

---
Université de Kinshasa - Secrétariat Général à la Recherche
    `,
  };
}
