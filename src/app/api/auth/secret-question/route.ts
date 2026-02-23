import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { userRepository } from "@/lib/repositories";

// GET - Get current user's secret question (without answer)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      hasSecretQuestion: !!user.secret_question,
      secretQuestion: user.secret_question || null,
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Set or update secret question and answer
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { secretQuestion, secretAnswer, currentPassword } = body;

    if (!secretQuestion || !secretAnswer) {
      return NextResponse.json({ error: "Question et réponse requises" }, { status: 400 });
    }

    if (secretAnswer.length < 2) {
      return NextResponse.json({ error: "La réponse doit contenir au moins 2 caractères" }, { status: 400 });
    }

    const user = await userRepository.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // If user already has a secret question, require current password to change it
    if (user.secret_question && currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
      }
    }

    // Hash the answer for security (case-insensitive comparison later)
    const hashedAnswer = await bcrypt.hash(secretAnswer.toLowerCase().trim(), 10);

    await userRepository.update(session.user.id, {
      secretQuestion: secretQuestion,
      secretAnswer: hashedAnswer,
    });

    return NextResponse.json({ message: "Question secrète enregistrée avec succès" });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
