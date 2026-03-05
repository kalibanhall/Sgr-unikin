import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { userRepository } from "@/lib/repositories";
import { logActivity, ACTION_TYPES } from "@/lib/activity-logger";

// GET - Récupérer tous les utilisateurs (Super Admin seulement)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const currentUser = await userRepository.findById(session.user.id);
    if (currentUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const users = await userRepository.findMany();

    // Filtrer uniquement les admins et super admins
    const adminUsers = users.filter(
      (user) => user.role === "ADMIN" || user.role === "SUPER_ADMIN"
    );

    // Ne pas renvoyer les mots de passe
    const sanitizedUsers = adminUsers.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      adminLevel: user.admin_level,
      isAppointmentManager: user.is_appointment_manager || false,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
    }));

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un nouvel utilisateur admin
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const currentUser = await userRepository.findById(session.user.id);
    if (currentUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, role, adminLevel } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Vérifier que l'email n'existe pas
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await userRepository.create({
      email,
      password: hashedPassword,
      name,
      role: role as 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN',
      adminLevel: adminLevel ? parseInt(adminLevel) : null,
      emailVerified: true,
    });

    // Log activity
    await logActivity({
      adminId: session.user.id,
      actionType: ACTION_TYPES.CREATE_ADMIN,
      targetType: 'USER',
      targetId: user.id,
      details: { email, name, role, adminLevel },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      adminLevel: user.admin_level,
    }, { status: 201 });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
