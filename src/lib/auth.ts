import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { env } from "./env";

// SECURITY: JWT_SECRET is validated by env.ts (min 32 chars) and the app
// refuses to boot without it — there is deliberately no insecure fallback.
const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

const AUTH_COOKIE = "auth_token";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Account-level brute-force lockout (in addition to the IP rate limiter in
// src/lib/rate-limit.ts — two layers: one per account, one per network
// address, so an attacker can't work around either alone).
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  // Uses the Prisma Role enum so the four roles stay defined in exactly one
  // place (prisma/schema.prisma).
  role: Role;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signJWTToken(payload: AuthSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyJWTToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthSession;
  } catch {
    // Covers expired, tampered, and malformed tokens alike. We deliberately
    // don't distinguish the reason to the caller — "not logged in" either way.
    return null;
  }
}

export async function setAuthCookie(session: AuthSession) {
  const token = await signJWTToken(session);
  cookies().set(AUTH_COOKIE, token, {
    httpOnly: true, // JavaScript in the browser can never read this cookie
    secure: env.NODE_ENV === "production", // HTTPS-only outside local dev
    sameSite: "lax", // sent on top-level navigation, blocked on cross-site POSTs
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

export async function clearAuthCookie() {
  cookies().set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Reads and verifies the session cookie. Returns null if the visitor isn't
 * logged in or their token is invalid/expired.
 *
 * IMPORTANT: this reflects who the JWT says the user is, signed at LOGIN
 * time. It never re-checks the database, so role changes only take effect
 * on next login. requireAuth() below re-validates on every call site that
 * matters — see the note there.
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyJWTToken(token);
}

/**
 * The base authorization check. Call this at the top of every server action,
 * route handler, or page that requires a logged-in user — of ANY role.
 *
 * SECURITY RULE: this must run on the SERVER, using the httpOnly cookie —
 * never trust a role or user id sent from the client (a hidden form field, a
 * query string, a header the browser could fake). The cookie is signed with
 * JWT_SECRET, so its contents cannot be forged without that secret.
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

/**
 * Like requireAuth(), but also restricts to specific roles.
 *
 * `allowedRoles` is typed as Role[], so a typo like requireRole(["ADMINN"])
 * is a compile error instead of a rule that silently never matches.
 *
 * Example:
 *   const session = await requireRole(["ADMIN"]);
 */
export async function requireRole(allowedRoles: Role[]): Promise<AuthSession> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

// Re-exported so existing imports of `roleHomePath` from "@/lib/auth" keep
// working. The definition itself lives in roles.ts, which has no
// next/headers dependency — see that file for why that split matters.
export { roleHomePath } from "./roles";
