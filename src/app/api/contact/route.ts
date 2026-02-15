import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getContactEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      );
    }

    // Email de destination du SGR
    const sgrEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'sg.recherche@unikin.ac.cd';

    // Générer le template d'email
    const emailTemplate = getContactEmailTemplate(name, email, subject, message);

    // Envoyer l'email
    const sent = await sendEmail({
      to: sgrEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    if (!sent) {
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi du message. Veuillez réessayer.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les meilleurs délais.',
    });

  } catch (error) {
    console.error('Erreur contact:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
