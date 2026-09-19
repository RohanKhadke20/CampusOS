import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/authorization";

export async function POST() {
  const cookieStore = await cookies();

  // Clear session cookie
  cookieStore.delete(SESSION_COOKIE_NAME);

  // Clear Supabase session cookies if present
  const allCookies = cookieStore.getAll();
  allCookies.forEach((c) => {
    if (c.name.startsWith("sb-") || c.name.includes("supabase")) {
      cookieStore.delete(c.name);
    }
  });

  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
