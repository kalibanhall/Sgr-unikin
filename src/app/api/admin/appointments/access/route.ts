import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userRepository } from "@/lib/repositories";

// GET - Check if current user has access to manage appointments
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ hasAccess: false }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ hasAccess: false });
    }

    // SUPER_ADMIN always has access
    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json({ hasAccess: true });
    }

    // Check if user is the designated appointment manager
    if (user.role === "ADMIN" && user.is_appointment_manager) {
      return NextResponse.json({ hasAccess: true });
    }

    return NextResponse.json({ hasAccess: false });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ hasAccess: false }, { status: 500 });
  }
}
