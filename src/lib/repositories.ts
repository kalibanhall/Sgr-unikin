import { query, generateId, User, Student, Document, Validation, Appointment, Faculty, AdminReview, AdminActivityLog, OtpCode } from './db';

// =====================================================
// USER REPOSITORY
// =====================================================

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const result = await query<User>('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const result = await query<User>('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    return result.rows[0] || null;
  },

  async findByVerifyToken(token: string): Promise<User | null> {
    const result = await query<User>('SELECT * FROM users WHERE verify_token = $1', [token]);
    return result.rows[0] || null;
  },

  async findByResetToken(token: string): Promise<User | null> {
    const result = await query<User>(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_expires > NOW()',
      [token]
    );
    return result.rows[0] || null;
  },

  async findMany(options?: { role?: string; limit?: number; offset?: number }): Promise<User[]> {
    let sql = 'SELECT * FROM users';
    const params: unknown[] = [];
    
    if (options?.role) {
      sql += ' WHERE role = $1';
      params.push(options.role);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options?.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }
    
    const result = await query<User>(sql, params);
    return result.rows;
  },

  async create(data: {
    email: string;
    password: string;
    name?: string;
    role?: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
    adminLevel?: number | null;
    emailVerified?: boolean;
    verifyToken?: string;
    verifyExpires?: Date;
  }): Promise<User> {
    const id = generateId();
    const result = await query<User>(
      `INSERT INTO users (id, email, password, name, role, admin_level, email_verified, verify_token, verify_expires)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        data.email.toLowerCase(),
        data.password,
        data.name || null,
        data.role || 'STUDENT',
        data.adminLevel || null,
        data.emailVerified || false,
        data.verifyToken || null,
        data.verifyExpires || null
      ]
    );
    return result.rows[0];
  },

  async update(id: string, data: Partial<{
    email: string;
    password: string;
    name: string;
    role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
    adminLevel: number | null;
    emailVerified: boolean;
    verifyToken: string | null;
    verifyExpires: Date | null;
    resetToken: string | null;
    resetExpires: Date | null;
    secretQuestion: string | null;
    secretAnswer: string | null;
    failedResetAttempts: number;
    resetLockedUntil: Date | null;
    isAppointmentManager: boolean;
  }>): Promise<User | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.email !== undefined) {
      setClauses.push(`email = $${paramIndex++}`);
      values.push(data.email.toLowerCase());
    }
    if (data.password !== undefined) {
      setClauses.push(`password = $${paramIndex++}`);
      values.push(data.password);
    }
    if (data.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.role !== undefined) {
      setClauses.push(`role = $${paramIndex++}`);
      values.push(data.role);
    }
    if (data.adminLevel !== undefined) {
      setClauses.push(`admin_level = $${paramIndex++}`);
      values.push(data.adminLevel);
    }
    if (data.emailVerified !== undefined) {
      setClauses.push(`email_verified = $${paramIndex++}`);
      values.push(data.emailVerified);
    }
    if (data.verifyToken !== undefined) {
      setClauses.push(`verify_token = $${paramIndex++}`);
      values.push(data.verifyToken);
    }
    if (data.verifyExpires !== undefined) {
      setClauses.push(`verify_expires = $${paramIndex++}`);
      values.push(data.verifyExpires);
    }
    if (data.resetToken !== undefined) {
      setClauses.push(`reset_token = $${paramIndex++}`);
      values.push(data.resetToken);
    }
    if (data.resetExpires !== undefined) {
      setClauses.push(`reset_expires = $${paramIndex++}`);
      values.push(data.resetExpires);
    }
    if (data.secretQuestion !== undefined) {
      setClauses.push(`secret_question = $${paramIndex++}`);
      values.push(data.secretQuestion);
    }
    if (data.secretAnswer !== undefined) {
      setClauses.push(`secret_answer = $${paramIndex++}`);
      values.push(data.secretAnswer);
    }
    if (data.failedResetAttempts !== undefined) {
      setClauses.push(`failed_reset_attempts = $${paramIndex++}`);
      values.push(data.failedResetAttempts);
    }
    if (data.resetLockedUntil !== undefined) {
      setClauses.push(`reset_locked_until = $${paramIndex++}`);
      values.push(data.resetLockedUntil);
    }
    if (data.isAppointmentManager !== undefined) {
      setClauses.push(`is_appointment_manager = $${paramIndex++}`);
      values.push(data.isAppointmentManager);
    }

    if (setClauses.length === 0) return null;

    values.push(id);
    const result = await query<User>(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async count(role?: string): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM users';
    const params: unknown[] = [];
    
    if (role) {
      sql += ' WHERE role = $1';
      params.push(role);
    }
    
    const result = await query<{ count: string }>(sql, params);
    return parseInt(result.rows[0].count);
  }
};

// =====================================================
// STUDENT REPOSITORY
// =====================================================

// Interface pour les résultats de jointure student + user
interface StudentWithUserRow extends Student {
  email: string;
  user_name: string;
  role: string;
  email_verified: boolean;
  user_created_at: Date;
}

export const studentRepository = {
  async findById(id: string): Promise<Student | null> {
    const result = await query<Student>('SELECT * FROM students WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByUserId(userId: string): Promise<Student | null> {
    const result = await query<Student>('SELECT * FROM students WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  },

  async findWithUser(studentId: string): Promise<(Student & { user: User }) | null> {
    const result = await query<StudentWithUserRow>(
      `SELECT s.*, u.email, u.name as user_name, u.role, u.email_verified, u.created_at as user_created_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [studentId]
    );
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    return {
      ...row,
      user: {
        id: row.user_id,
        email: row.email,
        name: row.user_name,
        role: row.role,
        email_verified: row.email_verified,
        created_at: row.user_created_at
      } as unknown as User
    } as Student & { user: User };
  },

  async findMany(options?: {
    dossierStatus?: string;
    faculty?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<(Student & { user: User })[]> {
    let sql = `
      SELECT s.*, u.email, u.name as user_name, u.role, u.email_verified
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options?.dossierStatus) {
      sql += ` AND s.dossier_status = $${paramIndex++}`;
      params.push(options.dossierStatus);
    }
    if (options?.faculty) {
      sql += ` AND s.faculty = $${paramIndex++}`;
      params.push(options.faculty);
    }
    if (options?.search) {
      sql += ` AND (
        LOWER(s.first_name) LIKE $${paramIndex} OR 
        LOWER(s.last_name) LIKE $${paramIndex} OR 
        LOWER(u.email) LIKE $${paramIndex} OR
        LOWER(s.matricule) LIKE $${paramIndex}
      )`;
      params.push(`%${options.search.toLowerCase()}%`);
      paramIndex++;
    }

    sql += ' ORDER BY s.created_at DESC';

    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options?.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    const result = await query(sql, params);
    return result.rows.map((row: Record<string, unknown>) => ({
      ...row,
      user: {
        id: row.user_id,
        email: row.email,
        name: row.user_name,
        role: row.role,
        email_verified: row.email_verified
      }
    })) as (Student & { user: User })[];
  },

  async create(data: {
    userId: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    placeOfBirth?: string;
    nationality?: string;
    gender?: string;
    phone?: string;
    address?: string;
    matricule?: string;
    faculty?: string;
    department?: string;
    studyLevel?: 'LICENCE' | 'MASTER' | 'DOCTORAT';
    specialization?: string;
    thesisTitle?: string;
    supervisor?: string;
    coSupervisor?: string;
  }): Promise<Student> {
    const id = generateId();
    const result = await query<Student>(
      `INSERT INTO students (
        id, user_id, first_name, last_name, date_of_birth, place_of_birth,
        nationality, gender, phone, address, matricule, faculty, department,
        study_level, specialization, thesis_title, supervisor, co_supervisor
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        id,
        data.userId,
        data.firstName,
        data.lastName,
        data.dateOfBirth || null,
        data.placeOfBirth || null,
        data.nationality || 'Congolaise',
        data.gender || null,
        data.phone || null,
        data.address || null,
        data.matricule || null,
        data.faculty || null,
        data.department || null,
        data.studyLevel || 'DOCTORAT',
        data.specialization || null,
        data.thesisTitle || null,
        data.supervisor || null,
        data.coSupervisor || null
      ]
    );
    return result.rows[0];
  },

  async update(id: string, data: Partial<{
    firstName: string;
    lastName: string;
    dateOfBirth: Date | null;
    placeOfBirth: string | null;
    nationality: string;
    gender: string | null;
    phone: string | null;
    address: string | null;
    matricule: string | null;
    faculty: string | null;
    department: string | null;
    studyLevel: 'LICENCE' | 'MASTER' | 'DOCTORAT';
    specialization: string | null;
    thesisTitle: string | null;
    supervisor: string | null;
    coSupervisor: string | null;
    currentStep: number;
    isComplete: boolean;
    dossierStatus: 'DRAFT' | 'SUBMITTED' | 'VALIDATED' | 'COMPLETED';
    submittedAt: Date | null;
    draftExpiresAt: Date | null;
  }>): Promise<Student | null> {
    const fieldMappings: Record<string, string> = {
      firstName: 'first_name',
      lastName: 'last_name',
      dateOfBirth: 'date_of_birth',
      placeOfBirth: 'place_of_birth',
      studyLevel: 'study_level',
      thesisTitle: 'thesis_title',
      coSupervisor: 'co_supervisor',
      currentStep: 'current_step',
      isComplete: 'is_complete',
      dossierStatus: 'dossier_status',
      submittedAt: 'submitted_at',
      draftExpiresAt: 'draft_expires_at'
    };

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const dbField = fieldMappings[key] || key.toLowerCase();
        setClauses.push(`${dbField} = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) return null;

    values.push(id);
    const result = await query<Student>(
      `UPDATE students SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM students WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async count(options?: { dossierStatus?: string; faculty?: string }): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM students WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options?.dossierStatus) {
      sql += ` AND dossier_status = $${paramIndex++}`;
      params.push(options.dossierStatus);
    }
    if (options?.faculty) {
      sql += ` AND faculty = $${paramIndex++}`;
      params.push(options.faculty);
    }

    const result = await query<{ count: string }>(sql, params);
    return parseInt(result.rows[0].count);
  },

  async countByStatus(): Promise<Record<string, number>> {
    const result = await query<{ dossier_status: string; count: string }>(
      `SELECT dossier_status, COUNT(*) as count FROM students GROUP BY dossier_status`
    );
    const counts: Record<string, number> = {};
    for (const row of result.rows) {
      counts[row.dossier_status] = parseInt(row.count);
    }
    return counts;
  },

  async countByFaculty(): Promise<{ faculty: string; count: number }[]> {
    const result = await query<{ faculty: string; count: string }>(
      `SELECT faculty, COUNT(*) as count FROM students WHERE faculty IS NOT NULL GROUP BY faculty ORDER BY count DESC`
    );
    return result.rows.map(row => ({ faculty: row.faculty, count: parseInt(row.count) }));
  }
};

// =====================================================
// DOCUMENT REPOSITORY
// =====================================================

export const documentRepository = {
  async findById(id: string): Promise<Document | null> {
    const result = await query<Document>('SELECT * FROM documents WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByStudentId(studentId: string): Promise<Document[]> {
    const result = await query<Document>(
      'SELECT * FROM documents WHERE student_id = $1 ORDER BY uploaded_at DESC',
      [studentId]
    );
    return result.rows;
  },

  async findByStudentAndType(studentId: string, type: string): Promise<Document | null> {
    const result = await query<Document>(
      'SELECT * FROM documents WHERE student_id = $1 AND type = $2 ORDER BY uploaded_at DESC LIMIT 1',
      [studentId, type]
    );
    return result.rows[0] || null;
  },

  async create(data: {
    studentId: string;
    name: string;
    type: string;
    url: string;
    size?: number;
    mimeType?: string;
  }): Promise<Document> {
    const id = generateId();
    const result = await query<Document>(
      `INSERT INTO documents (id, student_id, name, type, url, size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, data.studentId, data.name, data.type, data.url, data.size || null, data.mimeType || null]
    );
    return result.rows[0];
  },

  async update(id: string, data: Partial<{
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }>): Promise<Document | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.url !== undefined) {
      setClauses.push(`url = $${paramIndex++}`);
      values.push(data.url);
    }
    if (data.size !== undefined) {
      setClauses.push(`size = $${paramIndex++}`);
      values.push(data.size);
    }
    if (data.mimeType !== undefined) {
      setClauses.push(`mime_type = $${paramIndex++}`);
      values.push(data.mimeType);
    }

    if (setClauses.length === 0) return null;

    values.push(id);
    const result = await query<Document>(
      `UPDATE documents SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM documents WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async deleteByStudentAndType(studentId: string, type: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM documents WHERE student_id = $1 AND type = $2',
      [studentId, type]
    );
    return (result.rowCount ?? 0) > 0;
  }
};

// =====================================================
// VALIDATION REPOSITORY
// =====================================================

export const validationRepository = {
  async findByStudentId(studentId: string): Promise<Validation[]> {
    const result = await query<Validation>(
      'SELECT * FROM validations WHERE student_id = $1 ORDER BY step ASC',
      [studentId]
    );
    return result.rows;
  },

  async findByStudentAndStep(studentId: string, step: number): Promise<Validation | null> {
    const result = await query<Validation>(
      'SELECT * FROM validations WHERE student_id = $1 AND step = $2',
      [studentId, step]
    );
    return result.rows[0] || null;
  },

  async upsert(data: {
    studentId: string;
    step: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    comment?: string;
    validatedBy?: string;
    validatedAt?: Date;
  }): Promise<Validation> {
    const id = generateId();
    const result = await query<Validation>(
      `INSERT INTO validations (id, student_id, step, status, comment, validated_by, validated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (student_id, step) 
       DO UPDATE SET status = $4, comment = $5, validated_by = $6, validated_at = $7
       RETURNING *`,
      [
        id,
        data.studentId,
        data.step,
        data.status,
        data.comment || null,
        data.validatedBy || null,
        data.validatedAt || null
      ]
    );
    return result.rows[0];
  },

  async create(data: {
    studentId: string;
    step: number;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    comment?: string;
    validatedBy?: string;
    validatedAt?: Date;
  }): Promise<Validation> {
    const id = generateId();
    const result = await query<Validation>(
      `INSERT INTO validations (id, student_id, step, status, comment, validated_by, validated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        data.studentId,
        data.step,
        data.status || 'PENDING',
        data.comment || null,
        data.validatedBy || null,
        data.validatedAt || null
      ]
    );
    return result.rows[0];
  }
};

// =====================================================
// APPOINTMENT REPOSITORY
// =====================================================

export const appointmentRepository = {
  async findById(id: string): Promise<Appointment | null> {
    const result = await query<Appointment>('SELECT * FROM appointments WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByStudentId(studentId: string): Promise<Record<string, unknown>[]> {
    const result = await query<Appointment>(
      'SELECT * FROM appointments WHERE student_id = $1 ORDER BY created_at DESC',
      [studentId]
    );
    // Transformer en camelCase pour le frontend
    return result.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      targetRole: row.target_role,
      subject: row.subject,
      message: row.message,
      requestedDate: row.requested_date,
      approvedDate: row.approved_date,
      adminNote: row.admin_note,
      status: row.status,
      createdAt: row.created_at,
    }));
  },

  async findMany(options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<(Appointment & { student: Student & { user: User } })[]> {
    let sql = `
      SELECT 
        a.id, a.student_id, a.target_role, a.subject, a.message, 
        a.requested_date, a.approved_date, a.admin_note, a.status, a.created_at,
        a.guest_name, a.guest_email, a.guest_phone,
        s.first_name, s.last_name, s.study_level, s.faculty,
        u.email
      FROM appointments a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options?.status) {
      sql += ` AND a.status = $${paramIndex++}`;
      params.push(options.status);
    }

    sql += ' ORDER BY a.created_at DESC';

    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options?.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    const result = await query(sql, params);
    return result.rows as (Appointment & { student: Student & { user: User } })[];
  },

  async create(data: {
    studentId?: string;
    targetRole: string;
    subject: string;
    message?: string;
    requestedDate: Date;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
  }): Promise<Record<string, unknown>> {
    const id = generateId();
    const result = await query<Appointment>(
      `INSERT INTO appointments (id, student_id, target_role, subject, message, requested_date, guest_name, guest_email, guest_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, data.studentId || null, data.targetRole, data.subject, data.message || null, data.requestedDate, data.guestName || null, data.guestEmail || null, data.guestPhone || null]
    );
    const row = result.rows[0];
    // Transformer en camelCase pour le frontend
    return {
      id: row.id,
      studentId: row.student_id,
      targetRole: row.target_role,
      subject: row.subject,
      message: row.message,
      requestedDate: row.requested_date,
      approvedDate: row.approved_date,
      adminNote: row.admin_note,
      status: row.status,
      guestName: row.guest_name,
      guestEmail: row.guest_email,
      guestPhone: row.guest_phone,
      createdAt: row.created_at,
    };
  },

  async update(id: string, data: Partial<{
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedDate: Date | null;
    adminNote: string | null;
  }>): Promise<Appointment | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.approvedDate !== undefined) {
      setClauses.push(`approved_date = $${paramIndex++}`);
      values.push(data.approvedDate);
    }
    if (data.adminNote !== undefined) {
      setClauses.push(`admin_note = $${paramIndex++}`);
      values.push(data.adminNote);
    }

    if (setClauses.length === 0) return null;

    values.push(id);
    const result = await query<Appointment>(
      `UPDATE appointments SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }
};

// =====================================================
// FACULTY REPOSITORY
// =====================================================

export const facultyRepository = {
  async findAll(): Promise<(Faculty & { _count: { departments: number } })[]> {
    const result = await query<Faculty>('SELECT * FROM faculties ORDER BY name ASC');
    // Retourner avec un count de 0 par défaut (pas de table departments)
    return result.rows.map(faculty => ({
      ...faculty,
      _count: { departments: 0 }
    }));
  },

  async findById(id: string): Promise<Faculty | null> {
    const result = await query<Faculty>('SELECT * FROM faculties WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByCode(code: string): Promise<Faculty | null> {
    const result = await query<Faculty>('SELECT * FROM faculties WHERE code = $1', [code]);
    return result.rows[0] || null;
  },

  async create(data: { name: string; code: string }): Promise<Faculty> {
    const id = generateId();
    const result = await query<Faculty>(
      'INSERT INTO faculties (id, name, code) VALUES ($1, $2, $3) RETURNING *',
      [id, data.name, data.code]
    );
    return result.rows[0];
  },

  async upsert(data: { name: string; code: string }): Promise<Faculty> {
    const id = generateId();
    const result = await query<Faculty>(
      `INSERT INTO faculties (id, name, code) VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET name = $2
       RETURNING *`,
      [id, data.name, data.code]
    );
    return result.rows[0];
  },

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM faculties WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
};

// =====================================================
// ADMIN REVIEW REPOSITORY
// =====================================================

export const adminReviewRepository = {
  async findAll(studentId?: string): Promise<(AdminReview & { admin: User })[]> {
    let sql = `SELECT ar.*, u.name as admin_name, u.email as admin_email
       FROM admin_reviews ar
       JOIN users u ON ar.admin_id = u.id`;
    const params: string[] = [];
    
    if (studentId) {
      sql += ` WHERE ar.student_id = $1`;
      params.push(studentId);
    }
    
    sql += ` ORDER BY ar.created_at DESC`;
    
    const result = await query(sql, params);
    return result.rows as (AdminReview & { admin: User })[];
  },

  async findByAdminId(adminId: string, studentId?: string): Promise<(AdminReview & { admin: User })[]> {
    let sql = `SELECT ar.*, u.name as admin_name, u.email as admin_email
       FROM admin_reviews ar
       JOIN users u ON ar.admin_id = u.id
       WHERE ar.admin_id = $1`;
    const params: string[] = [adminId];
    
    if (studentId) {
      sql += ` AND ar.student_id = $2`;
      params.push(studentId);
    }
    
    sql += ` ORDER BY ar.created_at DESC`;
    
    const result = await query(sql, params);
    return result.rows as (AdminReview & { admin: User })[];
  },

  async findByStudentId(studentId: string): Promise<(AdminReview & { admin: User })[]> {
    const result = await query(
      `SELECT ar.*, u.name as admin_name, u.email as admin_email
       FROM admin_reviews ar
       JOIN users u ON ar.admin_id = u.id
       WHERE ar.student_id = $1
       ORDER BY ar.created_at DESC`,
      [studentId]
    );
    return result.rows as (AdminReview & { admin: User })[];
  },

  async create(data: {
    studentId: string;
    adminId: string;
    step: number;
    decision: string;
    comment?: string;
    isPrivate?: boolean;
  }): Promise<AdminReview> {
    const id = generateId();
    const result = await query<AdminReview>(
      `INSERT INTO admin_reviews (id, student_id, admin_id, step, decision, comment, is_private)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        data.studentId,
        data.adminId,
        data.step,
        data.decision,
        data.comment || null,
        data.isPrivate ?? true
      ]
    );
    return result.rows[0];
  }
};

// =====================================================
// ADMIN ACTIVITY LOG REPOSITORY
// =====================================================

export const activityLogRepository = {
  async create(data: {
    adminId: string;
    actionType: string;
    targetType?: string;
    targetId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<AdminActivityLog> {
    const id = generateId();
    const result = await query<AdminActivityLog>(
      `INSERT INTO admin_activity_logs (id, admin_id, action_type, target_type, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        data.adminId,
        data.actionType,
        data.targetType || null,
        data.targetId || null,
        JSON.stringify(data.details || {}),
        data.ipAddress || null,
      ]
    );
    return result.rows[0];
  },

  async findAll(options?: {
    adminId?: string;
    actionType?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: (AdminActivityLog & { admin_name: string | null; admin_email: string })[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options?.adminId) {
      conditions.push(`al.admin_id = $${paramIndex++}`);
      params.push(options.adminId);
    }
    if (options?.actionType) {
      conditions.push(`al.action_type = $${paramIndex++}`);
      params.push(options.actionType);
    }
    if (options?.targetType) {
      conditions.push(`al.target_type = $${paramIndex++}`);
      params.push(options.targetType);
    }
    if (options?.startDate) {
      conditions.push(`al.created_at >= $${paramIndex++}`);
      params.push(options.startDate);
    }
    if (options?.endDate) {
      conditions.push(`al.created_at <= $${paramIndex++}`);
      params.push(options.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [countResult, logsResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM admin_activity_logs al ${whereClause}`,
        params
      ),
      query<AdminActivityLog & { admin_name: string | null; admin_email: string }>(
        `SELECT al.*, u.name as admin_name, u.email as admin_email
         FROM admin_activity_logs al
         JOIN users u ON al.admin_id = u.id
         ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      ),
    ]);

    return {
      logs: logsResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  },

  async getActionTypes(): Promise<string[]> {
    const result = await query<{ action_type: string }>(
      'SELECT DISTINCT action_type FROM admin_activity_logs ORDER BY action_type'
    );
    return result.rows.map(r => r.action_type);
  },

  async getAdmins(): Promise<{ id: string; name: string | null; email: string }[]> {
    const result = await query<{ id: string; name: string | null; email: string }>(
      `SELECT DISTINCT u.id, u.name, u.email 
       FROM admin_activity_logs al 
       JOIN users u ON al.admin_id = u.id 
       ORDER BY u.name`
    );
    return result.rows;
  },
};

// =====================================================
// OTP CODE REPOSITORY
// =====================================================

export const otpCodeRepository = {
  async create(data: {
    userId: string;
    code: string;
    expiresAt: Date;
  }): Promise<OtpCode> {
    // Invalidate any existing unused OTPs for this user
    await query(
      `UPDATE otp_codes SET used = TRUE WHERE user_id = $1 AND used = FALSE`,
      [data.userId]
    );

    const id = generateId();
    const result = await query<OtpCode>(
      `INSERT INTO otp_codes (id, user_id, code, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, data.userId, data.code, data.expiresAt]
    );
    return result.rows[0];
  },

  async findValid(userId: string, code: string): Promise<OtpCode | null> {
    const result = await query<OtpCode>(
      `SELECT * FROM otp_codes 
       WHERE user_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW() AND attempts < 5
       ORDER BY created_at DESC LIMIT 1`,
      [userId, code]
    );
    return result.rows[0] || null;
  },

  async findLatestForUser(userId: string): Promise<OtpCode | null> {
    const result = await query<OtpCode>(
      `SELECT * FROM otp_codes 
       WHERE user_id = $1 AND used = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  async incrementAttempts(id: string): Promise<void> {
    await query(
      `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`,
      [id]
    );
  },

  async markUsed(id: string): Promise<void> {
    await query(
      `UPDATE otp_codes SET used = TRUE WHERE id = $1`,
      [id]
    );
  },

  async cleanExpired(): Promise<void> {
    await query(
      `DELETE FROM otp_codes WHERE expires_at < NOW() OR used = TRUE`
    );
  },
};
