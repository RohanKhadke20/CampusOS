import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { getGmailAuthUrl } from "@campusos/integrations";

/**
 * GET /api/google/gmail/auth-url
 * Generates a Google OAuth authorization URL specifically for gmail.send scope.
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

    // Encode state with userId and type for the shared OAuth callback
    const state = Buffer.from(
      JSON.stringify({ userId: user.id, type: "gmail", timestamp: Date.now() })
    ).toString("base64url");

    const authUrl = getGmailAuthUrl(state);

    return NextResponse.json({
      success: true,
      data: { authUrl },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate Gmail auth URL." },
      { status: 500 }
    );
  }
}
