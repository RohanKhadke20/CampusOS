import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";
import { getDriveProvider } from "@campusos/integrations";

/**
 * POST /api/google/drive/folder
 * Creates or retrieves the default "CampusOS Resources" directory.
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

    const connection = demoDb.getGoogleConnection(user.id);
    const hasDrive = connection && connection.scope.includes("drive.file");

    const provider = getDriveProvider({
      encryptedRefreshToken: hasDrive ? connection.encryptedRefreshToken : undefined,
      userId: user.id,
      userEmail: connection?.email || user.email,
    });

    const folder = await provider.getOrCreateCampusOSFolder();

    return NextResponse.json({
      success: true,
      data: folder,
      provider: provider.providerName,
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.error || "folder_creation_failed",
        message: error.message || "Failed to create or retrieve CampusOS resource folder.",
      },
      { status }
    );
  }
}
