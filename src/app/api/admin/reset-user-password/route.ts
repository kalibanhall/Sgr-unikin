import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { userRepository } from "@/lib/repositories";

// POST - Admin resets user password (after 3 failed attempts or on request)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const currentUser = await userRepository.findById(session.user.id);
    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Reset password and unlock account
    await userRepository.update(userId, {
      password: hashedPassword,
      failedResetAttempts: 0,
      resetLockedUntil: null,
      resetToken: null,
      resetExpires: null,
    });

    return NextResponse.json({ 
      message: "Mot de passe réinitialisé avec succès",
      userEmail: user.email,
      userName: user.name,
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET - Get list of locked users (for admins)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const currentUser = await userRepository.findById(session.user.id);
    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Get all users who are locked or have failed attempts
    const users = await userRepository.findMany();
    const lockedUsers = users
      .filter(u => (u.reset_locked_until && new Date(u.reset_locked_until) > new Date()) || (u.failed_reset_attempts && u.failed_reset_attempts > 0))
      .map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        failedAttempts: u.failed_reset_attempts || 0,
        lockedUntil: u.reset_locked_until,
        isLocked: u.reset_locked_until && new Date(u.reset_locked_until) > new Date(),
      }));

    return NextResponse.json(lockedUsers);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
