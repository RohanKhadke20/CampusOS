import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";

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
    return NextResponse.json({
      success: true,
      message: removed
        ? "Google Calendar successfully disconnected."
        : "No active Google Calendar connection found.",
      connected: false,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to disconnect Google Calendar." },
      { status: 500 }
    );
  }
}
