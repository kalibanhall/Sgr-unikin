import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { userRepository, studentRepository, validationRepository } from "@/lib/repositories";
import { registerSchema } from "@/lib/validations";
import { sendEmail, getVerificationEmailTemplate } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation des données
    const validatedData = registerSchema.parse(body);
    
    // Vérifier si l'email existe déjà
    const existingUser = await userRepository.findByEmail(validatedData.email);

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    // Générer le token de vérification
    const verifyToken = uuidv4();
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    // Créer l'utilisateur
    const user = await userRepository.create({
      email: validatedData.email,
      password: hashedPassword,
      name: `${validatedData.firstName} ${validatedData.lastName}`,
      role: "STUDENT",
      emailVerified: false,
      verifyToken: verifyToken,
      verifyExpires: verifyExpires,
    });

    // Créer le profil étudiant
    const student = await studentRepository.create({
      userId: user.id,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone || undefined,
      faculty: validatedData.faculty,
      department: validatedData.department || undefined,
      studyLevel: validatedData.studyLevel as 'LICENCE' | 'MASTER' | 'DOCTORAT',
      committeeMembers: validatedData.committeeMembers || undefined,
    });
    
    // Envoyer l'email de vérification
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify-email?token=${verifyToken}`;
    const emailTemplate = getVerificationEmailTemplate(validatedData.firstName, verifyUrl);
    
    await sendEmail({
      to: validatedData.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    // Créer la première validation (étape 0 complétée)
    await validationRepository.create({
      studentId: student.id,
      step: 0,
      status: "APPROVED",
      validatedAt: new Date(),
      comment: "Inscription initiale complétée",
    });

    // Mettre à jour le current_step à 1
    await studentRepository.update(student.id, { currentStep: 1 });

    return NextResponse.json(
      {
        message: "Inscription réussie. Un email de confirmation vous a été envoyé.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        emailSent: true,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Erreur d'inscription:", error);
    
    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json(
        { error: "Données invalides", details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    );
  }
}
