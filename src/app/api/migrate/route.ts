import { NextRequest, NextResponse } from "next/server";
import { runMigrations } from "@/lib/migrations";

// Secret key to prevent unauthorized migration runs
const MIGRATION_SECRET = process.env.NEXTAUTH_SECRET;

// GET /api/migrate?secret=YOUR_NEXTAUTH_SECRET
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  
  // Require secret for security
  if (!secret || secret !== MIGRATION_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized - Invalid secret" },
      { status: 401 }
    );
  }

  try {
    const success = await runMigrations();
    
    if (success) {
      return NextResponse.json({
        status: "success",
        message: "Migrations completed successfully",
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        status: "partial",
        message: "Some migrations may have failed - check logs",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Migration endpoint error:", error);
    return NextResponse.json(
      { 
        status: "error",
        error: error instanceof Error ? error.message : "Migration failed" 
      },
      { status: 500 }
    );
  }
}
