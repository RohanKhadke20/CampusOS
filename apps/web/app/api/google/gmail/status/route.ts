import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";

/**
 * GET /api/google/gmail/status
 * Returns the current Gmail connection status for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const connection = demoDb.getGoogleConnection(user.id);
    const hasGmail = connection && connection.scope.includes("gmail.send");

    if (!connection || !hasGmail) {
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          provider: "demo_local",
          message: "Gmail not connected. Using demo/local provider.",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        provider: "google_gmail",
        email: connection.email,
        scope: connection.scope,
        updatedAt: connection.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check Gmail status." },
      { status: 500 }
    );
  }
}
