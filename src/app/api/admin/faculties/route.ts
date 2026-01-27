import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userRepository, facultyRepository } from "@/lib/repositories";

// GET - Récupérer toutes les facultés
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const faculties = await facultyRepository.findAll();

    return NextResponse.json(faculties);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
