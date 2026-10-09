import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes configuration
const PUBLIC_PATHS = ["/login", "/api"];
const STATIC_ASSET_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".js",
  ".css",
  ".woff",
  ".woff2",
];

// Role permission mapping
const CASHIER_FORBIDDEN_ROUTES = [
  "/owner",
  "/users",
  "/regulatory",
  "/compounding",
  "/procurement",
];

const APOTEKER_FORBIDDEN_ROUTES = ["/owner", "/users"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow static assets and Next.js internal paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    STATIC_ASSET_EXTENSIONS.some((ext) => pathname.endsWith(ext)) ||
    PUBLIC_PATHS.some((pub) => pathname === pub || pathname.startsWith(`${pub}/`))
  ) {
    return NextResponse.next();
  }

  // 2. Read session cookies
  const sessionToken = request.cookies.get("kerso_session_token")?.value;
  const userRole = request.cookies.get("kerso_session_role")?.value;

  // 3. Unauthenticated -> Redirect to login
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("returnUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. Role-based access control (RBAC) enforcement
  if (userRole === "KARYAWAN_KASIR") {
    const isForbidden = CASHIER_FORBIDDEN_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    if (isForbidden) {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("access_denied", "true");
      redirectUrl.searchParams.set("denied_path", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (userRole === "KARYAWAN_APOTEKER") {
    const isForbidden = APOTEKER_FORBIDDEN_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    if (isForbidden) {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("access_denied", "true");
      redirectUrl.searchParams.set("denied_path", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 5. Allowed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
