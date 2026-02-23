import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { userRepository } from "@/lib/repositories";

// GET - Get secret question for an email (for recovery)
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    
    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ error: "Aucune question secrète configurée" }, { status: 404 });
    }

    // Check if account is locked
    if (user.reset_locked_until && new Date(user.reset_locked_until) > new Date()) {
      return NextResponse.json({ 
        error: "Compte temporairement bloqué. Contactez un administrateur.",
        locked: true
      }, { status: 423 });
    }

    if (!user.secret_question) {
      return NextResponse.json({ error: "Aucune question secrète configurée" }, { status: 404 });
    }

    return NextResponse.json({
      secretQuestion: user.secret_question,
      failedAttempts: user.failed_reset_attempts || 0,
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Verify secret answer and reset password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, secretAnswer, newPassword } = body;

    if (!email || !secretAnswer || !newPassword) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Check if account is locked
    if (user.reset_locked_until && new Date(user.reset_locked_until) > new Date()) {
      return NextResponse.json({ 
        error: "Compte bloqué pour récupération. Contactez un administrateur.",
        locked: true
      }, { status: 423 });
    }

    if (!user.secret_question || !user.secret_answer) {
      return NextResponse.json({ error: "Aucune question secrète configurée" }, { status: 400 });
    }

    // Verify the answer (case-insensitive)
    const isValidAnswer = await bcrypt.compare(secretAnswer.toLowerCase().trim(), user.secret_answer);

    if (!isValidAnswer) {
      const newFailedAttempts = (user.failed_reset_attempts || 0) + 1;
      
      if (newFailedAttempts >= 3) {
        // Lock the account recovery for 24 hours
        const lockUntil = new Date();
        lockUntil.setHours(lockUntil.getHours() + 24);
        
        await userRepository.update(user.id, {
          failedResetAttempts: newFailedAttempts,
          resetLockedUntil: lockUntil,
        });

        return NextResponse.json({ 
          error: "Trop de tentatives échouées. Compte bloqué pour la récupération. Contactez un administrateur.",
          locked: true,
          failedAttempts: newFailedAttempts 
        }, { status: 423 });
      }

      await userRepository.update(user.id, {
        failedResetAttempts: newFailedAttempts,
      });

      return NextResponse.json({ 
        error: `Réponse incorrecte. ${3 - newFailedAttempts} tentative(s) restante(s).`,
        failedAttempts: newFailedAttempts
      }, { status: 400 });
    }

    // Answer is correct - reset password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await userRepository.update(user.id, {
      password: hashedPassword,
      failedResetAttempts: 0,
      resetLockedUntil: null,
      resetToken: null,
      resetExpires: null,
    });

    return NextResponse.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
