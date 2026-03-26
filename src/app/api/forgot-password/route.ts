import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories';
import { query } from '@/lib/db';

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
        message: 'Si un compte existe avec cet email, une demande de réinitialisation sera créée.',
      });
    }

    // Vérifier qu'il n'y a pas déjà une demande en attente
    const existingRequest = await query(
      `SELECT id, created_at FROM password_reset_requests WHERE user_id = $1 AND status = 'PENDING' ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    );
    
    if (existingRequest.rows.length > 0) {
      // Vérifier rate limiting: pas plus d'une demande par minute
      const lastRequest = existingRequest.rows[0];
      const timeSince = Date.now() - new Date(lastRequest.created_at).getTime();
      if (timeSince < 60000) {
        const secondsLeft = Math.ceil((60000 - timeSince) / 1000);
        return NextResponse.json(
          { error: `Une demande est déjà en attente. Veuillez patienter ${secondsLeft} secondes.` },
          { status: 429 }
        );
      }
    }

    // Créer la demande de réinitialisation pour approbation admin
    await query(
      `INSERT INTO password_reset_requests (id, user_id, status) VALUES (uuid_generate_v4(), $1, 'PENDING')`,
      [user.id]
    );

    console.log(`[RESET] Demande de réinitialisation créée pour ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Demande de réinitialisation soumise. Un administrateur traitera votre demande.',
    });

  } catch (error) {
    console.error('Erreur forgot-password:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
