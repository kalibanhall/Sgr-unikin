import { NextRequest, NextResponse } from 'next/server';
import { userRepository, otpCodeRepository } from '@/lib/repositories';
import { query } from '@/lib/db';

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

    // Créer aussi une demande de réinitialisation pour approbation admin
    // Vérifier qu'il n'y a pas déjà une demande en attente
    const existingRequest = await query(
      `SELECT id FROM password_reset_requests WHERE user_id = $1 AND status = 'PENDING'`,
      [user.id]
    );
    if (existingRequest.rows.length === 0) {
      await query(
        `INSERT INTO password_reset_requests (id, user_id, status) VALUES (uuid_generate_v4(), $1, 'PENDING')`,
        [user.id]
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

    console.log(`[OTP] Code généré pour ${user.email}: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: 'Code OTP généré avec succès. Une demande de réinitialisation a aussi été envoyée à l\'administrateur.',
      userId: user.id,
      directMode: true,
      otpCode: otpCode,
      adminRequestSent: true,
    });

  } catch (error) {
    console.error('Erreur forgot-password OTP:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
