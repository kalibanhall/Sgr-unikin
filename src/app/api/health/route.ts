import { NextResponse } from "next/server";

// Endpoint de santé pour le keep-alive
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "SGR-UNIKIN"
  });
}
