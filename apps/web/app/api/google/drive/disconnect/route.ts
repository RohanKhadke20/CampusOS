import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";

/**
 * POST /api/google/drive/disconnect
 * Disconnects Google Drive by removing or unlinking Drive credentials from the user account.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const removed = demoDb.deleteGoogleConnection(user.id);

    demoDb.logAudit({
      actorId: user.id,
      action: "GOOGLE_DRIVE_DISCONNECTED",
      resourceType: "google_connection",
      resourceId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: removed
        ? "Google Drive successfully disconnected. Reverted to demo resource provider."
        : "No active Google connection was linked.",
      connected: false,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to disconnect Google Drive." },
      { status: 500 }
    );
  }
}
