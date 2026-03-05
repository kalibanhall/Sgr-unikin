import { NextRequest, NextResponse } from 'next/server';
import { otpCodeRepository } from '@/lib/repositories';

export async function POST(request: NextRequest) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'User ID et code OTP requis' },
        { status: 400 }
      );
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Le code doit contenir exactement 6 chiffres' },
        { status: 400 }
      );
    }

    // Check for valid OTP
    const otpRecord = await otpCodeRepository.findValid(userId, code);

    if (!otpRecord) {
      // Check if there's a latest OTP to increment attempts on
      const latestOtp = await otpCodeRepository.findLatestForUser(userId);
      if (latestOtp) {
        await otpCodeRepository.incrementAttempts(latestOtp.id);
        
        const remaining = 5 - (latestOtp.attempts + 1);
        if (remaining <= 0) {
          return NextResponse.json(
            { error: 'Trop de tentatives. Veuillez demander un nouveau code.' },
            { status: 429 }
          );
        }
        
        return NextResponse.json(
          { error: `Code invalide ou expiré. ${remaining} tentative(s) restante(s).` },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Code invalide ou expiré. Veuillez demander un nouveau code.' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await otpCodeRepository.markUsed(otpRecord.id);

    // Generate a temporary reset token for the password change step
    const resetToken = crypto.randomUUID();
    
    // Import userRepository to set the reset token
    const { userRepository } = await import('@/lib/repositories');
    await userRepository.update(userId, {
      resetToken,
      resetExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes to complete password change
    });

    return NextResponse.json({
      success: true,
      message: 'Code OTP vérifié avec succès.',
      resetToken,
    });

  } catch (error) {
    console.error('Erreur verify-otp:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
