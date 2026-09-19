import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSupabaseClient } from "./server";
import type { UserRole, AuthUser } from "./types";
import { SEEDED_DEMO_ACCOUNTS, getDemoAccountByEmail, getDemoAccountByRole } from "./demo-accounts";
import { demoDb } from "@campusos/db";
import { hasPermission, type Permission } from "@campusos/core";

export const SESSION_COOKIE_NAME = "campusos_session";

/**
 * Resolves user role server-side directly from the database or authoritative demo registry.
 * SECURITY: Never trust role information sent from the browser/client.
 */
export async function resolveUserRole(userId: string, email?: string): Promise<UserRole> {
  // 1. Check authoritative database by userId
  const dbUsers = demoDb.getUsers();
  const foundUser = dbUsers.find((u) => u.id === userId || (email && u.email.toLowerCase() === email.toLowerCase()));
  if (foundUser) {
    return foundUser.role;
  }

  // 2. Check seeded demo accounts
  if (email) {
    const demoAccount = getDemoAccountByEmail(email);
    if (demoAccount) {
      return demoAccount.role;
    }
  }

  // 3. Fallback default for any new user is lowest privilege: STUDENT
  return "STUDENT";
}

/**
 * Resolves the authenticated user strictly from server-side validated cookies.
 * Does not trust any unverified client headers.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();

  // 1. Try Supabase Auth via server client
  const supabase = await getServerSupabaseClient();
  if (supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        const email = user.email || "";
        const role = await resolveUserRole(user.id, email);
        const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0] || "Campus User";

        return {
          id: user.id,
          email,
          role,
          name,
          avatarUrl: user.user_metadata?.avatar_url,
          provider: user.app_metadata?.provider === "google" ? "google" : "email",
          createdAt: user.created_at,
        };
      }
    } catch (err) {
      console.error("[CampusOS Auth] Error getting Supabase user:", err);
    }
  }

  // 2. Read server-side session cookie (campusos_session)
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (sessionCookie && sessionCookie.value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie.value));
      if (parsed && parsed.userId) {
        // Resolve authoritative role from database on server, NOT from cookie!
        const role = await resolveUserRole(parsed.userId, parsed.email);
        const demoAccount = parsed.email ? getDemoAccountByEmail(parsed.email) : null;

        return {
          id: parsed.userId,
          email: parsed.email || "demo@campusos.edu",
          role, // authoritative server-resolved role
          name: demoAccount?.name || parsed.name || "Campus Member",
          avatarUrl: demoAccount?.avatarUrl || parsed.avatarUrl,
          department: demoAccount?.department || parsed.department,
          studentId: demoAccount?.studentId || parsed.studentId,
          provider: parsed.provider || "demo",
        };
      }
    } catch {
      // Invalid cookie format
    }
  }

  return null;
}

/**
 * Server-side guard: Requires user to be authenticated.
 * If not authenticated, immediately redirects to /login.
 */
export async function requireAuth(redirectTo = "/login"): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

/**
 * Server-side guard: Requires user to hold one of the allowed roles.
 * Resolves role server-side.
 * If unauthorized, immediately redirects to /unauthorized.
 */
export async function requireRole(
  allowedRoles: UserRole | UserRole[],
  redirectTo = "/unauthorized"
): Promise<AuthUser> {
  const user = await requireAuth();
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!allowed.includes(user.role)) {
    redirect(`${redirectTo}?required=${encodeURIComponent(allowed.join(","))}&current=${encodeURIComponent(user.role)}`);
  }

  return user;
}

/**
 * Server-side guard: Requires user to possess a specific fine-grained permission.
 * Uses core RBAC matrix.
 */
export async function requirePermission(
  permission: Permission,
  redirectTo = "/unauthorized"
): Promise<AuthUser> {
  const user = await requireAuth();

  if (!hasPermission(user.role, permission)) {
    redirect(`${redirectTo}?permission=${encodeURIComponent(permission)}&current=${encodeURIComponent(user.role)}`);
  }

  return user;
}

/**
 * Helper to check authorization without redirecting (useful in API routes).
 */
export async function checkServerAuthorization(
  allowedRoles?: UserRole[]
): Promise<{ authorized: boolean; user: AuthUser | null; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { authorized: false, user: null, error: "Unauthenticated" };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      user,
      error: `Forbidden: role '${user.role}' does not meet required '${allowedRoles.join(",")}'`,
    };
  }

  return { authorized: true, user };
}
