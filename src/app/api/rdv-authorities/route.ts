import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { userRepository } from "@/lib/repositories";

// GET - List all active authorities (public)
export async function GET() {
  try {
    const result = await query(
      'SELECT id, value, nom, fonction, description, initiales, display_order FROM rdv_authorities WHERE active = TRUE ORDER BY display_order ASC'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Create a new authority (super admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const user = await userRepository.findById(session.user.id);
    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { value, nom, fonction, description, initiales } = await request.json();
    if (!value || !nom || !fonction) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    // Get next display_order
    const maxOrder = await query('SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM rdv_authorities');
    const nextOrder = maxOrder.rows[0].next_order;

    const result = await query(
      `INSERT INTO rdv_authorities (value, nom, fonction, description, initiales, display_order) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [value, nom, fonction, description || null, initiales || null, nextOrder]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Update an authority (super admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const user = await userRepository.findById(session.user.id);
    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id, nom, fonction, description, initiales } = await request.json();
    if (!id || !nom || !fonction) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const result = await query(
      `UPDATE rdv_authorities SET nom = $1, fonction = $2, description = $3, initiales = $4, updated_at = NOW() 
       WHERE id = $5 RETURNING *`,
      [nom, fonction, description || null, initiales || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Autorité non trouvée" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Delete an authority (super admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const user = await userRepository.findById(session.user.id);
    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await query('DELETE FROM rdv_authorities WHERE id = $1', [id]);
    return NextResponse.json({ message: "Autorité supprimée" });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
