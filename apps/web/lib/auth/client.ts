import { createBrowserClient } from "@supabase/ssr";
import type { UserRole, AuthUser } from "./types";
import { getDemoAccountByRole } from "./demo-accounts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== "https://placeholder.supabase.co"
);

export function getBrowserSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Initiates Google OAuth Sign-in via Supabase
 */
export async function signInWithGoogle(redirectTo?: string): Promise<{ error: Error | null }> {
  const supabase = getBrowserSupabaseClient();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const callbackUrl = `${origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`;

  if (!supabase) {
    // If Supabase is not configured with live credentials, simulate demo Google sign-in
    console.info("[CampusOS Auth] Supabase not configured. Using Google demo sign-in simulation.");
    const res = await fetch("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "STUDENT", provider: "google" }),
    });
    if (!res.ok) {
      return { error: new Error("Failed to sign in with simulated Google provider.") };
    }
    if (typeof window !== "undefined") {
      window.location.href = redirectTo || "/";
    }
    return { error: null };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  return { error };
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  pass: string,
  redirectTo?: string
): Promise<{ user?: AuthUser; error: Error | null }> {
  const supabase = getBrowserSupabaseClient();

  if (!supabase) {
    // Demo fallback for email login
    const res = await fetch("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: new Error(data.error || "Login failed") };
    }
    if (typeof window !== "undefined") {
      window.location.href = redirectTo || "/";
    }
    return { user: data.user, error: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (error) {
    return { error };
  }

  if (typeof window !== "undefined") {
    window.location.href = redirectTo || "/";
  }

  return { error: null };
}

/**
 * Instant login for Seeded Demo Accounts (STUDENT, ORGANIZER, ADMIN)
 * Sets server-side session cookie via /api/auth/demo-login
 */
export async function signInWithDemoAccount(
  role: UserRole,
  redirectTo?: string
): Promise<{ user?: AuthUser; error: Error | null }> {
  try {
    const res = await fetch("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: new Error(data.error || "Failed to log in to demo account") };
    }

    if (typeof window !== "undefined") {
      window.location.href = redirectTo || "/";
    }
    return { user: data.user, error: null };
  } catch (err: any) {
    return { error: new Error(err.message || "Network error during demo login") };
  }
}

/**
 * Sign out and clear session persistence cookies
 */
export async function signOut(): Promise<void> {
  const supabase = getBrowserSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }

  // Call server logout route to delete HTTP-only cookies
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }

  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
