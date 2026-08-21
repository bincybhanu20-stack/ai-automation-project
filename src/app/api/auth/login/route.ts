import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  comparePassword,
  setAuthCookie,
  roleHomePath,
  MAX_FAILED_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/csrf";
import { logAuditEvent } from "@/lib/audit";

// A precomputed bcrypt hash of a random string (not a real password for any
// account). When the submitted email doesn't match a user, we still run a
// comparePassword() against this so the response takes roughly the same time
// either way — otherwise an attacker could tell "email exists" from "email
// doesn't exist" purely by how fast the response comes back.
const DUMMY_HASH = "$2a$10$C6UzMDM.H6dfI/f/IKcEeOgpP4RqNVW3ZvR2ecP4CFwvvxbTxRUpS";

const GENERIC_ERROR = "Invalid email or password.";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const ip = getClientIp(request);

  // Per-IP limit: stops an attacker from cycling through many different
  // email addresses from one machine, independent of any single account's
  // own lockout below.
  const ipLimit = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    await comparePassword(password, DUMMY_HASH); // constant-time-ish decoy
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  // Check lockout BEFORE spending CPU on a bcrypt compare, and before
  // revealing anything password-dependent.
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Account temporarily locked. Try again in ${minutesLeft} minute(s).` },
      { status: 423 }
    );
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    const attempts = user.failedLoginAttempts + 1;
    const lockingNow = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: lockingNow
          ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
          : null,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "LOGIN_FAILED",
      entity: "Auth",
      entityId: user.id,
      ipAddress: ip,
      metadata: { attempts, locked: lockingNow },
    });

    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  if (user.status === "SUSPENDED") {
    await logAuditEvent({
      userId: user.id,
      action: "LOGIN_BLOCKED_SUSPENDED",
      entity: "Auth",
      entityId: user.id,
      ipAddress: ip,
    });
    return NextResponse.json(
      { error: "Your account has been suspended. Contact an administrator." },
      { status: 403 }
    );
  }

  // Successful login: clear any lockout state and issue the session.
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  await setAuthCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  await logAuditEvent({
    userId: user.id,
    action: "USER_LOGIN",
    entity: "Auth",
    entityId: user.id,
    ipAddress: ip,
  });

  return NextResponse.json({ redirectTo: roleHomePath(user.role) });
}
