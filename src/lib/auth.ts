import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { env } from "./env";

// SECURITY FIX (Phase 1):
// This previously fell back to a hardcoded secret when JWT_SECRET was unset.
// That meant a deploy with a missing env var would accept tokens signed with a
// public, well-known string — anyone could forge an admin session.
// `env.ts` now validates JWT_SECRET (min 32 chars) and throws at startup if it
// is missing, so there is no insecure fallback path any more.
const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  // Uses the Prisma Role enum so the four roles stay defined in exactly one
  // place (prisma/schema.prisma). Previously "MEMBER" here did not match any
  // real role value.
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
  } catch (err) {
    return null;
  }
}

export async function setAuthCookie(session: AuthSession) {
  const token = await signJWTToken(session);
  const cookieStore = cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return verifyJWTToken(token);
}

/**
 * Use this at the top of every protected server action and API route.
 *
 * `allowedRoles` is now typed as Role[] instead of string[], so a typo like
 * requireAuthSession(["ADMINN"]) becomes a compile error rather than a rule
 * that silently never matches and locks everyone out.
 */
export async function requireAuthSession(
  allowedRoles?: Role[]
): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
