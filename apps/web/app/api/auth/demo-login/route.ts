import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SEEDED_DEMO_ACCOUNTS, getDemoAccountByEmail } from "@/lib/auth/demo-accounts";
import { SESSION_COOKIE_NAME, resolveUserRole } from "@/lib/auth/authorization";
import type { UserRole } from "@/lib/auth/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const role: UserRole = body.role || "STUDENT";
    const email: string = body.email || "";

    let account = SEEDED_DEMO_ACCOUNTS[role];
    if (email) {
      const found = getDemoAccountByEmail(email);
      if (found) account = found;
    }

    if (!account) {
      account = SEEDED_DEMO_ACCOUNTS.STUDENT;
    }

    // Resolve authoritative server-side role
    const authoritativeRole = await resolveUserRole(account.id, account.email);

    const sessionPayload = {
      userId: account.id,
      email: account.email,
      name: account.name,
      role: authoritativeRole, // Server-resolved
      department: account.department,
      studentId: account.studentId,
      avatarUrl: account.avatarUrl,
      provider: body.provider || "demo",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, encodeURIComponent(JSON.stringify(sessionPayload)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({
      success: true,
      user: {
        id: account.id,
        email: account.email,
        name: account.name,
        role: authoritativeRole,
        department: account.department,
        avatarUrl: account.avatarUrl,
        provider: sessionPayload.provider,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to establish demo session" },
      { status: 500 }
    );
  }
}
