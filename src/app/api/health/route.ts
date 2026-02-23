import { NextResponse } from "next/server";
import { runMigrations } from "@/lib/migrations";

// Track if migrations have run this deployment
let migrationsRun = false;

// Endpoint de santé pour le keep-alive
export async function GET() {
  // Run migrations once on first health check
  if (!migrationsRun) {
    migrationsRun = true;
    // Run async without blocking health response
    runMigrations().catch(console.error);
  }

  return NextResponse.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "SGR-UNIKIN"
  });
}
