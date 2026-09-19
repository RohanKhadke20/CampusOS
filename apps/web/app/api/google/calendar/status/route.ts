import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";

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
    if (!connection) {
      return NextResponse.json({
        success: true,
        connected: false,
      });
    }

    // NEVER return encryptedRefreshToken or any token to browser!
    return NextResponse.json({
      success: true,
      connected: true,
      data: {
        email: connection.email,
        scope: connection.scope,
        updatedAt: connection.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check connection status." },
      { status: 500 }
    );
  }
}
