import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userRepository, adminReviewRepository, studentRepository, validationRepository } from "@/lib/repositories";
import { ADMIN_LEVELS } from "@/lib/constants";

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

    // Tous les admins voient l'historique complet des avis pour un dossier
    const reviews = await adminReviewRepository.findAll(studentId || undefined);

    // Transformer en camelCase pour le frontend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedReviews = (reviews as any[]).map((r) => ({
      id: r.id,
      step: r.step,
      decision: r.decision,
      comment: r.comment,
      createdAt: r.created_at,
      admin: {
        name: r.admin_name || null,
        email: r.admin_email,
        role: r.role || 'ADMIN',
      },
    }));

    return NextResponse.json(formattedReviews);
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

    const stepNumber = parseInt(step);

    // Vérifier que l'admin a le niveau requis pour cette étape
    if (user.role !== "SUPER_ADMIN") {
      const adminLevel = user.admin_level || 1;
      const levelConfig = ADMIN_LEVELS.find(l => l.level === adminLevel);
      if (!levelConfig || !levelConfig.allowedSteps.includes(stepNumber)) {
        return NextResponse.json(
          { error: `Vous n'avez pas les droits pour donner un avis sur l'étape ${stepNumber}. Votre niveau : ${adminLevel}` },
          { status: 403 }
        );
      }
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

    // Transformer en camelCase
    const formattedReview = {
      id: review.id,
      step: review.step,
      decision: review.decision,
      comment: review.comment,
      createdAt: review.created_at,
    };

    return NextResponse.json(formattedReview);
  } catch (error) {
    console.error("Erreur POST reviews:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
