import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { userRepository } from "@/lib/repositories";
import { sendEmail, getVerificationEmailTemplate } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token de vérification manquant" },
        { status: 400 }
      );
    }

    // Rechercher l'utilisateur avec ce token
    const user = await userRepository.findByVerifyToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "Token de vérification invalide" },
        { status: 400 }
      );
    }

    // Vérifier si le token n'a pas expiré
    if (user.verify_expires && new Date() > new Date(user.verify_expires)) {
      return NextResponse.json(
        { error: "Le lien de vérification a expiré. Veuillez demander un nouveau lien." },
        { status: 400 }
      );
    }

    // Vérifier si l'email est déjà vérifié
    if (user.email_verified) {
      return NextResponse.json(
        { message: "Votre email est déjà vérifié", alreadyVerified: true },
        { status: 200 }
      );
    }

    // Marquer l'email comme vérifié
    await userRepository.update(user.id, {
      emailVerified: true,
      verifyToken: null,
      verifyExpires: null,
    });

    return NextResponse.json(
      { message: "Email vérifié avec succès", verified: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur de vérification d'email:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la vérification" },
      { status: 500 }
    );
  }
}

// Endpoint pour renvoyer l'email de vérification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Ne pas révéler si l'email existe ou non
      return NextResponse.json(
        { message: "Si cet email existe, un nouveau lien de vérification a été envoyé." },
        { status: 200 }
      );
    }

    if (user.email_verified) {
      return NextResponse.json(
        { message: "Cet email est déjà vérifié" },
        { status: 200 }
      );
    }

    // Générer un nouveau token
    const verifyToken = uuidv4();
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await userRepository.update(user.id, {
      verifyToken,
      verifyExpires,
    });

    // Envoyer le nouvel email
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify-email?token=${verifyToken}`;
    const emailTemplate = getVerificationEmailTemplate(user.name || "Utilisateur", verifyUrl);

    await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return NextResponse.json(
      { message: "Un nouveau lien de vérification a été envoyé à votre email." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors du renvoi de l'email:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
