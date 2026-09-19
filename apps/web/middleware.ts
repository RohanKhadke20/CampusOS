import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SESSION_COOKIE_NAME = "campusos_session";

// Public routes that never require authentication
const PUBLIC_PATHS = [
  "/login",
  "/unauthorized",
  "/auth/callback",
  "/api/auth/demo-login",
  "/api/auth/logout",
  "/api/health",
];

// Routes strictly requiring ADMIN role
const ADMIN_PATHS = ["/admin", "/audit"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, next internal files, and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // file extensions like .ico, .svg, .png, etc.
  ) {
    return NextResponse.next();
  }

  // 2. Check if route is public
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let isAuthenticated = false;
  let userId: string | null = null;
  let userEmail: string | null = null;
  let resolvedRole: string = "STUDENT";

  // 3. Check Supabase session if configured
  if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== "https://placeholder.supabase.co") {
    try {
      const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        isAuthenticated = true;
        userId = user.id;
        userEmail = user.email || null;
      }
    } catch {
      // Supabase connection or cookie parsing issue
    }
  }

  // 4. Fallback: check campusos_session cookie
  if (!isAuthenticated) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    if (sessionCookie?.value) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
        if (sessionData && sessionData.userId) {
          isAuthenticated = true;
          userId = sessionData.userId;
          userEmail = sessionData.email || null;
        }
      } catch {
        // Invalid session cookie
      }
    }
  }

  // 5. Authoritative server-side role resolution (Never trust browser headers)
  if (isAuthenticated && (userId || userEmail)) {
    const emailNorm = (userEmail || "").toLowerCase();
    if (emailNorm.includes("admin") || emailNorm.includes("dean") || userId === "u-admin-01") {
      resolvedRole = "ADMIN";
    } else if (emailNorm.includes("organizer") || emailNorm.includes("sarah") || userId === "u-org-01") {
      resolvedRole = "ORGANIZER";
    } else {
      resolvedRole = "STUDENT";
    }
  }

  // 6. Redirect authenticated users away from /login
  if (isAuthenticated && pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  // 7. Redirect unauthenticated users trying to access protected paths
  if (!isAuthenticated && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 8. Role-based authorization for ADMIN routes (/admin, /audit)
  const isAdminRoute = ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (isAdminRoute && resolvedRole !== "ADMIN") {
    const unauthorizedUrl = request.nextUrl.clone();
    unauthorizedUrl.pathname = "/unauthorized";
    unauthorizedUrl.searchParams.set("required", "ADMIN");
    unauthorizedUrl.searchParams.set("current", resolvedRole);
    return NextResponse.redirect(unauthorizedUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
