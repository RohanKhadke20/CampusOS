import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { getGoogleAuthUrl, GOOGLE_CALENDAR_SCOPES } from "@campusos/integrations";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to connect Google Calendar." },
        { status: 401 }
      );
    }

    // State parameter contains the user's ID for secure association
    const state = JSON.stringify({ userId: user.id, timestamp: Date.now() });
    const authUrl = getGoogleAuthUrl(Buffer.from(state).toString("base64url"));

    return NextResponse.json({
      success: true,
      authUrl,
      scopes: GOOGLE_CALENDAR_SCOPES,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate authorization URL." },
      { status: 500 }
    );
  }
}
