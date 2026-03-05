import { NextRequest, NextResponse } from "next/server";
import { appointmentRepository } from "@/lib/repositories";

// POST /api/appointments - Créer un rendez-vous sans être inscrit (visiteur)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { targetRole, subject, message, requestedDate, guestName, guestEmail, guestPhone } = data;

    // Validation des champs requis
    if (!targetRole || !subject || !requestedDate || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: "Veuillez remplir tous les champs obligatoires (nom, email, destinataire, sujet, date)" },
        { status: 400 }
      );
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      return NextResponse.json(
        { error: "Adresse email invalide" },
        { status: 400 }
      );
    }

    // Validation de la date (pas dans le passé)
    const requested = new Date(requestedDate);
    if (isNaN(requested.getTime()) || requested < new Date()) {
      return NextResponse.json(
        { error: "La date demandée doit être dans le futur" },
        { status: 400 }
      );
    }

    // Validation des rôles autorisés
    const allowedRoles = ["SGR", "AP", "CHARGE_PUBLICATIONS", "CHARGE_ANTIPLAGIAT", "CHARGE_OIPR"];
    if (!allowedRoles.includes(targetRole)) {
      return NextResponse.json(
        { error: "Destinataire invalide" },
        { status: 400 }
      );
    }

    // Rate limiting basique : max 3 RDV en attente par email
    // (On vérifie via une requête directe car pas de méthode dédiée)
    const { query } = await import("@/lib/db");
    const existing = await query(
      `SELECT COUNT(*) as count FROM appointments WHERE guest_email = $1 AND status = 'PENDING'`,
      [guestEmail]
    );
    if (parseInt(existing.rows[0].count) >= 3) {
      return NextResponse.json(
        { error: "Vous avez déjà 3 demandes de rendez-vous en attente. Veuillez attendre qu'elles soient traitées." },
        { status: 429 }
      );
    }

    const appointment = await appointmentRepository.create({
      targetRole,
      subject,
      message,
      requestedDate: requested,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim().toLowerCase(),
      guestPhone: guestPhone?.trim() || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Votre demande de rendez-vous a été envoyée avec succès !",
      appointment,
    });
  } catch (error) {
    console.error("Erreur création RDV visiteur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
