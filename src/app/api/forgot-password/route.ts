import { NextRequest, NextResponse } from 'next/server';
import { userRepository, otpCodeRepository } from '@/lib/repositories';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
        success: true,
        message: 'Si un compte existe avec cet email, un code OTP sera généré.',
        // En mode direct, on indique qu'il n'y a pas de code (l'utilisateur ne saura pas si l'email existe)
        directMode: true,
        otpCode: null,
      });
    }

    // Vérifier si un OTP existe déjà et n'est pas expiré (rate limiting: 60 secondes)
    const existingOtp = await otpCodeRepository.findLatestForUser(user.id);
    if (existingOtp && new Date(existingOtp.created_at).getTime() > Date.now() - 60000) {
      const secondsLeft = Math.ceil(
        (new Date(existingOtp.created_at).getTime() + 60000 - Date.now()) / 1000
      );
      return NextResponse.json(
        { error: `Veuillez patienter ${secondsLeft} secondes avant de demander un nouveau code.` },
        { status: 429 }
      );
    }

    // Générer un code OTP à 6 chiffres
    const otpCode = generateOTP();
    
    // Le code expire dans 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Sauvegarder le code OTP
    await otpCodeRepository.create({
      userId: user.id,
      code: otpCode,
      expiresAt,
    });

    // TODO: Quand les APIs WhatsApp/SMS seront configurées, envoyer le code via ces canaux
    // Pour l'instant, on utilise le mode direct: le code est affiché à l'écran

    console.log(`[OTP] Code généré pour ${user.email}: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: 'Code OTP généré avec succès.',
      userId: user.id,
      // Mode direct: on renvoie le code pour l'afficher à l'écran
      // À retirer quand WhatsApp/SMS sera configuré
      directMode: true,
      otpCode: otpCode,
    });

  } catch (error) {
    console.error('Erreur forgot-password OTP:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
