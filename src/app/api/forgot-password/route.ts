import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '@/lib/repositories';
import { sendEmail, getPasswordResetEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    // Chercher l'utilisateur par email
    const user = await userRepository.findByEmail(email.toLowerCase().trim());

    // Pour des raisons de sécurité, on retourne toujours un succès
    // même si l'email n'existe pas
    if (!user) {
      return NextResponse.json({
        message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.',
      });
    }

    // Générer un token unique
    const resetToken = uuidv4();
    
    // Le token expire dans 1 heure
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Mettre à jour l'utilisateur avec le token
    await userRepository.update(user.id, {
      resetToken,
      resetExpires,
    });

    // Construire l'URL de réinitialisation
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Envoyer l'email
    const emailTemplate = getPasswordResetEmailTemplate(user.name || 'Utilisateur', resetUrl);
    
    try {
      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    } catch (emailError) {
      console.error('Erreur envoi email de réinitialisation:', emailError);
      // Nettoyer le token si l'email n'a pas pu être envoyé
      await userRepository.update(user.id, {
        resetToken: null,
        resetExpires: null,
      });
      return NextResponse.json(
        { error: "Impossible d'envoyer l'email. Veuillez réessayer ou contacter l'administrateur." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.',
    });

  } catch (error) {
    console.error('Erreur forgot-password:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
