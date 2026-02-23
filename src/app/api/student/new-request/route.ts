import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

// POST - Start a new request (soutenance, etc.) after inscription is complete
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { requestType } = body;

    // Validate request type
    const validTypes = ['SOUTENANCE', 'AUTRE'];
    if (!requestType || !validTypes.includes(requestType)) {
      return NextResponse.json(
        { error: 'Type de demande invalide' },
        { status: 400 }
      );
    }

    // Check if student has a completed inscription
    const studentResult = await query(
      `SELECT id, dossier_status, dossier_type, is_complete 
       FROM students 
       WHERE user_id = $1`,
      [session.user.id]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profil étudiant non trouvé' },
        { status: 404 }
      );
    }

    const student = studentResult.rows[0];

    // Only allow new request if current dossier is COMPLETED
    if (student.dossier_status !== 'COMPLETED' || !student.is_complete) {
      return NextResponse.json(
        { error: 'Votre dossier actuel doit être validé avant de pouvoir faire une nouvelle demande' },
        { status: 400 }
      );
    }

    // Archive current documents by adding a prefix to their type
    await query(
      `UPDATE documents 
       SET type = 'ARCHIVE_' || type || '_' || $2
       WHERE student_id = $1`,
      [student.id, student.dossier_type || 'INSCRIPTION']
    );

    // Reset student dossier for new request
    await query(
      `UPDATE students SET
        dossier_type = $2,
        dossier_status = 'DRAFT',
        is_complete = false,
        current_step = 1,
        submitted_at = NULL,
        draft_expires_at = NOW() + INTERVAL '30 days',
        updated_at = NOW()
      WHERE id = $1`,
      [student.id, requestType]
    );

    // Log the action
    console.log(`📋 New ${requestType} request started by student ${student.id}`);

    return NextResponse.json({
      success: true,
      message: `Nouvelle demande de ${requestType === 'SOUTENANCE' ? 'soutenance' : 'autre type'} créée avec succès`,
      requestType
    });

  } catch (error) {
    console.error('Error creating new request:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la nouvelle demande' },
      { status: 500 }
    );
  }
}
