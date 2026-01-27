import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userRepository, facultyRepository } from "@/lib/repositories";

// DELETE - Supprimer une faculté
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;

    const deleted = await facultyRepository.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Faculté non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ message: "Faculté supprimée" });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
