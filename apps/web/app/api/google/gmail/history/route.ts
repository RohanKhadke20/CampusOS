import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";

/**
 * GET /api/google/gmail/history
 * Returns the audit trail of sent emails for the authenticated user.
 * Supports filtering by templateType.
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

    const { searchParams } = new URL(request.url);
    const templateType = searchParams.get("templateType") || undefined;

    const messages = demoDb.getGmailMessages(user.id, templateType);

    return NextResponse.json({
      success: true,
      data: messages,
      total: messages.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve email history." },
      { status: 500 }
    );
  }
}
