import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  
  // Vérification avec NEXTAUTH_SECRET
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Mettre à jour le rôle en SUPER_ADMIN
    const result = await query(
      `UPDATE users SET role = 'SUPER_ADMIN' WHERE email = $1 RETURNING id, email, name, role`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User promoted to SUPER_ADMIN',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error promoting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
