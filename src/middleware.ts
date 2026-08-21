import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ROUTE_ROLE_MAP, roleHomePath } from "@/lib/roles";
import type { Role } from "@prisma/client";

/**
 * Route protection — FIRST LINE OF DEFENSE ONLY.
 *
 * ============================================================================
 * SECURITY RULE: this middleware is a UX convenience, not the real security
 * boundary. It runs on Next.js's Edge runtime, which cannot use Prisma, so it
 * can only check "is there a validly-signed cookie, and does its role match
 * this path prefix?" — a coarse, path-level check.
 *
 * It CANNOT check resource ownership (e.g. "is this actually THIS client's
 * project?") — that requires a database query, which requireClientAccess()
 * and requireProjectAccess() in src/lib/authorization.ts perform on every
 * protected page, in the Node runtime, on every single request. Those are
 * the real enforcement. Never assume a request reaching a page has already
 * been fully authorized just because it passed through here.
 * ============================================================================
 *
 * This file intentionally does NOT import from src/lib/auth.ts — that module
 * imports next/headers, which is meant for Server Components/Route Handlers,
 * not Middleware. Cookie access here uses NextRequest/NextResponse's own
 * cookie APIs, and JWT verification is a small self-contained copy using
 * `jose` (the same library auth.ts uses — jose works on Edge, unlike
 * jsonwebtoken, which needs Node's crypto module directly).
 *
 * NOTE ON FILE LOCATION: with a src/ directory layout, Next.js requires this
 * file at src/middleware.ts, not at the project root — a root-level
 * middleware.ts is silently ignored (confirmed via an empty
 * .next/server/middleware-manifest.json during testing).
 */

const AUTH_COOKIE = "auth_token";

interface AuthTokenPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null; // env.ts validates this at server startup; defensive only
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as unknown as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  // Already logged in and visiting the login page? Send them where they
  // actually belong instead of showing the login form again.
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL(roleHomePath(session.role), request.url));
  }

  const matchedRule = ROUTE_ROLE_MAP.find((rule) => pathname.startsWith(rule.prefix));
  if (!matchedRule) {
    return NextResponse.next();
  }

  if (!session) {
    // Not logged in at all — send to login, remembering where they wanted
    // to go so we can return them there after a successful login.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!matchedRule.roles.includes(session.role)) {
    // Logged in, but the wrong role for this area (e.g. a CLIENT visiting
    // /admin). Distinct from "not logged in" so the messaging is accurate.
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Only run on the paths that actually need it. Static assets, images and
  // the Next.js internals are excluded for performance — they're never
  // protected routes.
  matcher: ["/admin/:path*", "/manager/:path*", "/portal/:path*", "/login"],
};
