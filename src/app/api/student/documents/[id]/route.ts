import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { studentRepository, documentRepository } from "@/lib/repositories";
import { unlink } from "fs/promises";
import path from "path";

// DELETE - Supprimer un document par ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { id: documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        { error: "ID du document requis" },
        { status: 400 }
      );
    }

    const student = await studentRepository.findByUserId(session.user.id);

    if (!student) {
      return NextResponse.json(
        { error: "Profil non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le document appartient à l'étudiant
    const document = await documentRepository.findById(documentId);

    if (!document || document.student_id !== student.id) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Essayer de supprimer le fichier physique
    try {
      const fileName = document.url.split("/").pop();
      if (fileName) {
        const filePath = path.join(process.cwd(), "uploads", student.id, fileName);
        await unlink(filePath);
      }
    } catch (fileError) {
      console.warn("Fichier déjà supprimé ou inaccessible:", fileError);
    }

    // Supprimer de la base de données
    await documentRepository.delete(documentId);

    return NextResponse.json({ message: "Document supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}

// GET - Récupérer un document par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { id: documentId } = await params;

    const student = await studentRepository.findByUserId(session.user.id);

    if (!student) {
      return NextResponse.json(
        { error: "Profil non trouvé" },
        { status: 404 }
      );
    }

    const document = await documentRepository.findById(documentId);

    if (!document || document.student_id !== student.id) {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
