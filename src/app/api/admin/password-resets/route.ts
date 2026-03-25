import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { userRepository } from "@/lib/repositories";
import { randomBytes } from "crypto";

interface ResetRequestRow {
  id: string;
  user_id: string;
  status: string;
  token: string | null;
  expires_at: Date | null;
  approved_by: string | null;
  approved_at: Date | null;
  created_at: Date;
  user_email: string;
  user_name: string | null;
  user_role: string;
}

// GET - Liste des demandes de réinitialisation (Super Admin uniquement)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès réservé aux Super Admins" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "PENDING";

    const result = await query<ResetRequestRow>(
      `SELECT pr.*, u.email as user_email, u.name as user_name, u.role as user_role
       FROM password_reset_requests pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.status = $1
       ORDER BY pr.created_at DESC
       LIMIT 100`,
      [statusFilter]
    );

    const requests = result.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      status: r.status,
      createdAt: r.created_at,
      approvedAt: r.approved_at,
      user: {
        email: r.user_email,
        name: r.user_name,
        role: r.user_role,
      },
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Erreur password-resets GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Approuver une demande (génère un lien de réinitialisation)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès réservé aux Super Admins" }, { status: 403 });
    }

    const { requestId, action } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Vérifier que la demande existe et est en attente
    const reqResult = await query<{ id: string; user_id: string; status: string }>(
      `SELECT id, user_id, status FROM password_reset_requests WHERE id = $1`,
      [requestId]
    );

    if (reqResult.rows.length === 0) {
      return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 });
    }

    const resetRequest = reqResult.rows[0];

    if (resetRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Cette demande a déjà été traitée" }, { status: 400 });
    }

    if (action === "REJECT") {
      await query(
        `UPDATE password_reset_requests SET status = 'REJECTED', approved_by = $1, approved_at = NOW() WHERE id = $2`,
        [session.user.id, requestId]
      );
      return NextResponse.json({ success: true, message: "Demande rejetée" });
    }

    if (action === "APPROVE") {
      // Générer un token sécurisé
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      // Mettre à jour la demande
      await query(
        `UPDATE password_reset_requests 
         SET status = 'APPROVED', token = $1, expires_at = $2, approved_by = $3, approved_at = NOW() 
         WHERE id = $4`,
        [token, expiresAt, session.user.id, requestId]
      );

      // Aussi mettre le token dans la table users pour que /api/reset-password fonctionne
      await userRepository.update(resetRequest.user_id, {
        resetToken: token,
        resetExpires: expiresAt,
      });

      const baseUrl = process.env.NEXTAUTH_URL || "https://sgr.unikin.ac.cd";
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      return NextResponse.json({
        success: true,
        message: "Demande approuvée",
        resetLink,
        expiresAt,
      });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    console.error("Erreur password-resets POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
