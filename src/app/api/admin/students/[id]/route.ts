import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { userRepository, studentRepository, documentRepository } from "@/lib/repositories";

interface StudentRow {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_name: string;
  user_created_at: Date;
  email_verified: boolean;
  phone: string | null;
  date_of_birth: Date | null;
  place_of_birth: string | null;
  nationality: string | null;
  gender: string | null;
  address: string | null;
  matricule: string | null;
  faculty: string | null;
  department: string | null;
  study_level: string;
  specialization: string | null;
  thesis_title: string | null;
  supervisor: string | null;
  co_supervisor: string | null;
  current_step: number;
  max_steps: number;
  dossier_status: string;
  is_complete: boolean;
  submitted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

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
    const result = await query<StudentRow>(
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

    // Transformer en camelCase pour le frontend
    return NextResponse.json({
      id: student.id,
      userId: student.user_id,
      firstName: student.first_name,
      lastName: student.last_name,
      dateOfBirth: student.date_of_birth,
      placeOfBirth: student.place_of_birth,
      nationality: student.nationality,
      gender: student.gender,
      phone: student.phone,
      address: student.address,
      matricule: student.matricule,
      faculty: student.faculty,
      department: student.department,
      studyLevel: student.study_level,
      specialization: student.specialization,
      thesisTitle: student.thesis_title,
      supervisor: student.supervisor,
      coSupervisor: student.co_supervisor,
      currentStep: student.current_step,
      maxSteps: student.max_steps,
      isComplete: student.is_complete,
      dossierStatus: student.dossier_status,
      submittedAt: student.submitted_at,
      createdAt: student.created_at,
      user: {
        email: student.email,
        name: student.user_name,
        createdAt: student.user_created_at,
        emailVerified: student.email_verified,
      },
      documents: documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        url: doc.url,
        size: doc.size,
        mimeType: doc.mime_type,
        uploadedAt: doc.uploaded_at,
      })),
      validations: validationsResult.rows.map((v) => ({
        step: v.step,
        status: v.status,
        comment: v.comment,
        validatedAt: v.validated_at,
        validatedBy: v.validated_by,
      })),
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
