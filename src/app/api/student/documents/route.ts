import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { studentRepository, documentRepository } from "@/lib/repositories";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// GET - Récupérer les documents de l'étudiant
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const student = await studentRepository.findByUserId(session.user.id);

    if (!student) {
      return NextResponse.json(
        { error: "Profil non trouvé" },
        { status: 404 }
      );
    }

    const documents = await documentRepository.findByStudentId(student.id);

    // Mapper en camelCase pour le frontend
    const formatted = (documents as any[]).map((doc: any) => ({
      id: doc.id,
      studentId: doc.student_id,
      name: doc.name,
      type: doc.type,
      url: doc.url,
      size: doc.size,
      mimeType: doc.mime_type,
      uploadedAt: doc.uploaded_at,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Upload de documents
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const student = await studentRepository.findByUserId(session.user.id);

    if (!student) {
      return NextResponse.json(
        { error: "Profil non trouvé" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const files = file ? [file] : formData.getAll("files") as File[];
    const type = formData.get("type") as string || "autre";

    if (files.length === 0 || !files[0]) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Types de fichiers autorisés
    const ALLOWED_MIME_TYPES = [
      "application/pdf",
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/gif",
      "image/webp"
    ];

    const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp"];

    // Validation des fichiers
    for (const f of files) {
      const fileName = f.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf("."));
      
      const isValidMime = ALLOWED_MIME_TYPES.includes(f.type.toLowerCase());
      const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);
      
      if (!isValidMime && !isValidExtension) {
        return NextResponse.json(
          { 
            error: `Type de fichier non autorisé: ${f.name}. Formats acceptés: PDF, JPG, JPEG, PNG, GIF, WEBP` 
          },
          { status: 400 }
        );
      }

      // Limite de taille: 10 Mo
      const MAX_SIZE = 10 * 1024 * 1024;
      if (f.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `Le fichier ${f.name} dépasse la limite de 10 Mo` },
          { status: 400 }
        );
      }
    }

    const uploadDir = path.join(process.cwd(), "uploads", student.id);
    await mkdir(uploadDir, { recursive: true });

    const uploadedDocuments = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);

      const document = await documentRepository.create({
        studentId: student.id,
        name: file.name,
        type: type,
        url: `/api/uploads/${student.id}/${fileName}`,
        size: file.size,
        mimeType: file.type,
      });

      uploadedDocuments.push(document);
    }

    // Retourner un seul document si un seul fichier, sinon la liste
    // Mapper en camelCase
    const formatted = (uploadedDocuments as any[]).map((doc: any) => ({
      id: doc.id,
      studentId: doc.student_id,
      name: doc.name,
      type: doc.type,
      url: doc.url,
      size: doc.size,
      mimeType: doc.mime_type,
      uploadedAt: doc.uploaded_at,
    }));

    if (formatted.length === 1) {
      return NextResponse.json(formatted[0], { status: 201 });
    }

    return NextResponse.json(
      { message: "Documents téléversés avec succès", documents: formatted },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur upload:", error);
    return NextResponse.json(
      { error: "Erreur lors du téléversement" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un document
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");

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

    await documentRepository.delete(documentId);

    return NextResponse.json({ message: "Document supprimé" });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
