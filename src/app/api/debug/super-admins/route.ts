import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - List all super admins (for debugging only - remove in production)
// Access: /api/debug/super-admins?secret=your-secret
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');

    // Simple protection - use NEXTAUTH_SECRET
    if (secret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all super admins
    const superAdmins = await query(`
      SELECT id, email, name, role, admin_level, created_at 
      FROM users 
      WHERE role = 'SUPER_ADMIN'
      ORDER BY created_at DESC
    `);

    // Check for Jonathan/Mutwale
    const jonathanCheck = await query(`
      SELECT id, email, name, role, admin_level 
      FROM users 
      WHERE name ILIKE '%jonathan%' OR name ILIKE '%mutwale%' OR email ILIKE '%mutwale%'
    `);

    // All admins
    const allAdmins = await query(`
      SELECT id, email, name, role, admin_level 
      FROM users 
      WHERE role IN ('ADMIN', 'SUPER_ADMIN')
      ORDER BY role DESC, name ASC
    `);

    return NextResponse.json({
      superAdmins: superAdmins.rows,
      jonathanSearch: jonathanCheck.rows,
      allAdmins: allAdmins.rows,
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
