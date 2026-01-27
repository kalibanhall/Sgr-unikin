import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/lib/repositories';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et mot de passe requis' },
        { status: 400 }
      );
    }

    // Valider la longueur du mot de passe
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    // Chercher l'utilisateur avec ce token
    const user = await userRepository.findByResetToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Lien invalide ou expiré. Veuillez faire une nouvelle demande.' },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mettre à jour le mot de passe et supprimer le token
    await userRepository.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetExpires: null,
    });

    return NextResponse.json({
      message: 'Mot de passe réinitialisé avec succès',
    });

  } catch (error) {
    console.error('Erreur reset-password:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}

// Vérifier si un token est valide (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token manquant' },
        { status: 400 }
      );
    }

    const user = await userRepository.findByResetToken(token);

    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'Lien invalide ou expiré' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: {
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error('Erreur vérification token:', error);
    return NextResponse.json(
      { valid: false, error: 'Erreur de vérification' },
      { status: 500 }
    );
  }
}
