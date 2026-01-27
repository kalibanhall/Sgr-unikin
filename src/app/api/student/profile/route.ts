import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { studentRepository, userRepository } from "@/lib/repositories";

interface StudentProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_name: string;
  user_created_at: Date;
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
  created_at: Date;
}

// GET - Récupérer le profil de l'étudiant connecté
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // Récupérer l'étudiant avec ses documents et validations
    const result = await query<StudentProfile>(
      `SELECT 
        s.*,
        u.email,
        u.name as user_name,
        u.created_at as user_created_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = $1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Profil étudiant non trouvé" },
        { status: 404 }
      );
    }

    const student = result.rows[0];

    // Récupérer les documents
    const docsResult = await query(
      'SELECT * FROM documents WHERE student_id = $1 ORDER BY uploaded_at DESC',
      [student.id]
    );

    // Récupérer les validations
    const valsResult = await query(
      'SELECT * FROM validations WHERE student_id = $1 ORDER BY step ASC',
      [student.id]
    );

    return NextResponse.json({
      ...student,
      user: {
        email: student.email,
        name: student.user_name,
        createdAt: student.user_created_at,
      },
      documents: docsResult.rows,
      validations: valsResult.rows,
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour le profil
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Récupérer l'étudiant existant
    const student = await studentRepository.findByUserId(session.user.id);

    if (!student) {
      return NextResponse.json(
        { error: "Profil non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour l'étudiant
    const updatedStudent = await studentRepository.update(student.id, {
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      placeOfBirth: body.placeOfBirth,
      nationality: body.nationality,
      gender: body.gender,
      phone: body.phone,
      address: body.address,
      faculty: body.faculty,
      department: body.department,
      studyLevel: body.studyLevel,
      specialization: body.specialization,
      thesisTitle: body.thesisTitle,
      supervisor: body.supervisor,
      coSupervisor: body.coSupervisor,
    });

    // Mettre à jour le nom de l'utilisateur
    await userRepository.update(session.user.id, {
      name: `${body.firstName} ${body.lastName}`,
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
