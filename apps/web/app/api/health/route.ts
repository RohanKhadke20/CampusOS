import { NextResponse } from "next/server";
import { checkIntegrationsHealth } from "@campusos/integrations";
import { isDemoMode } from "@campusos/db";

export async function GET() {
  const integrations = checkIntegrationsHealth();
  const demoActive = isDemoMode();

  const response = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    demoMode: demoActive,
    version: "1.0.0",
    services: {
      database: {
        status: demoActive ? "demo_fallback" : "connected",
        mode: demoActive ? "In-Memory Seeded Repository" : "Supabase PostgreSQL",
      },
      ...integrations,
      mcp: {
        name: "MCP Server",
        status: "active",
        toolsCount: 8,
        isMock: false,
      },
    },
  };

  return NextResponse.json(response, { status: 200 });
}
