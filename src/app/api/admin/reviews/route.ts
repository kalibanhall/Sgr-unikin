import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userRepository, adminReviewRepository, studentRepository, validationRepository } from "@/lib/repositories";

// GET - Récupérer les avis (Super Admin voit tout, Admin voit les siens)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    // Récupérer les reviews selon le rôle
    let reviews;
    if (user.role === "SUPER_ADMIN") {
      // Super Admin voit tout
      reviews = await adminReviewRepository.findAll(studentId || undefined);
    } else {
      // Admin ne voit que ses propres avis
      reviews = await adminReviewRepository.findByAdminId(user.id, studentId || undefined);
    }

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Erreur GET reviews:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un avis
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, step, decision, comment } = body;

    if (!studentId || !step || !decision) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    // Créer l'avis
    const review = await adminReviewRepository.create({
      studentId,
      adminId: user.id,
      step: parseInt(step),
      decision: decision as 'PENDING' | 'APPROVED' | 'REJECTED',
      comment: comment || null,
      isPrivate: true,
    });

    // Si Super Admin et décision finale, on peut aussi mettre à jour la validation officielle
    if (user.role === "SUPER_ADMIN" && (decision === "APPROVED" || decision === "REJECTED")) {
      const student = await studentRepository.findById(studentId);

      if (student) {
        // Utiliser upsert pour créer ou mettre à jour la validation
        await validationRepository.upsert({
          studentId,
          step: parseInt(step),
          status: decision === "APPROVED" ? "APPROVED" : "REJECTED",
          comment: comment || null,
          validatedBy: user.id,
          validatedAt: new Date(),
        });

        // Mettre à jour l'étape de l'étudiant si approuvé
        if (decision === "APPROVED") {
          const newStep = parseInt(step) + 1;
          await studentRepository.update(studentId, {
            currentStep: newStep,
            isComplete: newStep > student.max_steps,
            dossierStatus: newStep > student.max_steps ? "COMPLETED" : "VALIDATED",
          });
        }
      }
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Erreur POST reviews:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
