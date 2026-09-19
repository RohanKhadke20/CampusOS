import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";
import { getGoogleDriveAuthUrl, GOOGLE_DRIVE_SCOPES } from "@campusos/integrations";

/**
 * GET /api/google/drive/auth-url
 * Returns Google OAuth consent URL requesting specifically the narrow 'drive.file' scope.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to connect Google Drive." },
        { status: 401 }
      );
    }

    const state = JSON.stringify({ userId: user.id, type: "drive", timestamp: Date.now() });
    const authUrl = getGoogleDriveAuthUrl(Buffer.from(state).toString("base64url"));

    return NextResponse.json({
      success: true,
      authUrl,
      scopes: GOOGLE_DRIVE_SCOPES,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate authorization URL." },
      { status: 500 }
    );
  }
}
