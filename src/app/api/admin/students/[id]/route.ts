import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { userRepository, studentRepository, documentRepository } from "@/lib/repositories";

// GET - Récupérer un étudiant par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;

    // Récupérer l'étudiant avec toutes ses infos
    const result = await query(
      `SELECT s.*, u.email, u.name as user_name, u.created_at as user_created_at, u.email_verified
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Étudiant non trouvé" }, { status: 404 });
    }

    const student = result.rows[0];

    // Récupérer les documents
    const documents = await documentRepository.findByStudentId(id);

    // Récupérer les validations
    const validationsResult = await query(
      'SELECT * FROM validations WHERE student_id = $1 ORDER BY step ASC',
      [id]
    );

    return NextResponse.json({
      ...student,
      user: {
        email: student.email,
        name: student.user_name,
        createdAt: student.user_created_at,
        emailVerified: student.email_verified,
      },
      documents,
      validations: validationsResult.rows,
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour un étudiant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const student = await studentRepository.findById(id);
    if (!student) {
      return NextResponse.json({ error: "Étudiant non trouvé" }, { status: 404 });
    }

    const updatedStudent = await studentRepository.update(id, {
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      placeOfBirth: body.placeOfBirth,
      nationality: body.nationality,
      gender: body.gender,
      phone: body.phone,
      address: body.address,
      matricule: body.matricule,
      faculty: body.faculty,
      department: body.department,
      studyLevel: body.studyLevel,
      specialization: body.specialization,
      thesisTitle: body.thesisTitle,
      supervisor: body.supervisor,
      coSupervisor: body.coSupervisor,
      currentStep: body.currentStep,
      isComplete: body.isComplete,
      dossierStatus: body.dossierStatus,
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer un étudiant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Seul le Super Admin peut supprimer" }, { status: 403 });
    }

    const { id } = await params;

    const student = await studentRepository.findById(id);
    if (!student) {
      return NextResponse.json({ error: "Étudiant non trouvé" }, { status: 404 });
    }

    // Supprimer l'utilisateur (cascade supprimera l'étudiant)
    await userRepository.delete(student.user_id);

    return NextResponse.json({ message: "Étudiant supprimé" });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
