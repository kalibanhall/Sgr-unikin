import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userRepository } from "@/lib/repositories";

// GET - Check if current user has access to manage appointments
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ hasAccess: false, canManage: false }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ hasAccess: false, canManage: false });
    }

    // SUPER_ADMIN always has full access
    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json({ hasAccess: true, canManage: true });
    }

    // Appointment manager can manage
    if (user.role === "ADMIN" && user.is_appointment_manager) {
      return NextResponse.json({ hasAccess: true, canManage: true });
    }

    // Level 1 (Accueil/Réception) can VIEW but not manage
    if (user.role === "ADMIN" && user.admin_level === 1) {
      return NextResponse.json({ hasAccess: true, canManage: false });
    }

    return NextResponse.json({ hasAccess: false, canManage: false });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ hasAccess: false, canManage: false }, { status: 500 });
  }
}
