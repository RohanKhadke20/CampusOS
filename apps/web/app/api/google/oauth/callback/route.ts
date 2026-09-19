import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/authorization";
import { demoDb } from "@campusos/db";
import { exchangeCodeForTokens, encryptRefreshToken } from "@campusos/integrations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const stateParam = searchParams.get("state");

    if (errorParam) {
      return NextResponse.json(
        { success: false, error: `Google authorization declined: ${errorParam}` },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Missing authorization code parameter." },
        { status: 400 }
      );
    }

    // Resolve user from session or state
    let userId: string | undefined;
    let oauthType = "calendar";
    if (stateParam) {
      try {
        const decodedState = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf8"));
        userId = decodedState.userId;
        if (decodedState.type) {
          oauthType = decodedState.type;
        }
      } catch {
        // Fall back to current user
      }
    }

    if (!userId) {
      const currentUser = await getCurrentUser(request);
      userId = currentUser?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User session not found for Google OAuth callback." },
        { status: 401 }
      );
    }

    // Exchange code for tokens (pass requested scopes depending on oauthType)
    const requestedScopes =
      oauthType === "drive"
        ? ["https://www.googleapis.com/auth/drive.file", "openid", "email", "profile"]
        : oauthType === "gmail"
        ? ["https://www.googleapis.com/auth/gmail.send", "openid", "email", "profile"]
        : undefined;

    const tokens = await exchangeCodeForTokens(code, requestedScopes);

    // SECURE STORAGE: Encrypt refresh token using AES-256-GCM before saving
    // Never expose refresh tokens in plaintext to the browser!
    const encryptedRefreshToken = encryptRefreshToken(tokens.refreshToken);

    const connection = demoDb.upsertGoogleConnection({
      userId,
      googleUserId: tokens.googleUserId,
      email: tokens.email,
      encryptedRefreshToken,
      scope: tokens.scope,
      tokenExpiry: tokens.expiryDate ? new Date(tokens.expiryDate).toISOString() : undefined,
    });

    const wantsJson =
      searchParams.get("format") === "json" ||
      request.headers.get("accept")?.includes("application/json");

    if (wantsJson) {
      // NEVER include encryptedRefreshToken or refreshToken in client responses!
      const successMessages: Record<string, string> = {
        drive: "Google Drive successfully connected.",
        gmail: "Gmail successfully connected.",
        calendar: "Google Calendar successfully connected.",
      };
      return NextResponse.json({
        success: true,
        message: successMessages[oauthType] || successMessages.calendar,
        data: {
          connected: true,
          email: connection.email,
          scope: connection.scope,
          updatedAt: connection.updatedAt,
        },
      });
    }

    const redirectPaths: Record<string, string> = {
      drive: "/resources?connected=drive",
      gmail: "/events?connected=gmail",
      calendar: "/events?connected=google",
    };
    const redirectPath = redirectPaths[oauthType] || redirectPaths.calendar;
    return NextResponse.redirect(new URL(redirectPath, request.url));
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to complete Google OAuth exchange." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Support POST for programmatic token exchange / testing
  try {
    const body = await request.json();
    const { code } = body;

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Missing authorization code." },
        { status: 400 }
      );
    }

    const tokens = await exchangeCodeForTokens(code);
    const encryptedRefreshToken = encryptRefreshToken(tokens.refreshToken);

    const connection = demoDb.upsertGoogleConnection({
      userId: user.id,
      googleUserId: tokens.googleUserId,
      email: tokens.email,
      encryptedRefreshToken,
      scope: tokens.scope,
      tokenExpiry: tokens.expiryDate ? new Date(tokens.expiryDate).toISOString() : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Google Calendar successfully connected.",
      data: {
        connected: true,
        email: connection.email,
        scope: connection.scope,
        updatedAt: connection.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Token exchange failed." },
      { status: 500 }
    );
  }
}
