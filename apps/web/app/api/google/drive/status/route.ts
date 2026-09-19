import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";
import { getDriveProvider } from "@campusos/integrations";

/**
 * GET /api/google/drive/status
 * Checks if user is connected to Google Drive or running in demo fallback mode.
 * Never exposes refresh tokens or secrets!
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to check Drive status." },
        { status: 401 }
      );
    }

    const connection = demoDb.getGoogleConnection(user.id);
    const hasDriveScope =
      connection &&
      (connection.scope.includes("drive.file") ||
        connection.scope.includes("drive") ||
        connection.scope.includes("googleapis.com/auth/drive"));

    // If connection exists and has drive scope, check provider
    const provider = getDriveProvider({
      encryptedRefreshToken: hasDriveScope ? connection.encryptedRefreshToken : undefined,
      userId: user.id,
      userEmail: connection?.email || user.email,
    });

    const status = await provider.getStatus();

    return NextResponse.json({
      success: true,
      connected: Boolean(hasDriveScope),
      provider: provider.providerName,
      email: hasDriveScope ? connection?.email : undefined,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve Google Drive status.",
      },
      { status: 500 }
    );
  }
}
