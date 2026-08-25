import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { verifyN8nSecret } from "@/lib/n8n-auth";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * TEMPORARY, ONE-TIME-USE route. Creates (or resets) a single dedicated QA
 * verification ADMIN account for regression testing, without touching any
 * existing user's credentials. Gated by the same shared n8n secret used
 * throughout this app's server-to-server auth (src/lib/n8n-auth.ts) —
 * mirrors the precedent already set by the (now-removed) test-task creation
 * endpoint. Never touches admin@clientflow.local or any other real account.
 *
 * Delete this file once verification testing is complete.
 */
export async function POST(request: Request) {
  const authError = verifyN8nSecret(request);
  if (authError) return authError;

  const email = "qa-verification@clientflow.local";
  const password = randomBytes(18).toString("base64url");
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", status: "ACTIVE", failedLoginAttempts: 0, lockedUntil: null },
    create: {
      email,
      name: "QA Verification",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  return NextResponse.json({ userId: user.id, email, password });
}

/**
 * Cleanup half of the same temporary endpoint: deactivates the QA
 * verification account once testing is complete. Calls the service
 * function directly rather than deactivateUserAction() — that action's
 * isSelf check is a UI convenience against accidental self-lockout, not a
 * security boundary (unenforced server-side), and doesn't apply to a
 * one-time-use test account being torn down deliberately.
 */
export async function DELETE(request: Request) {
  const authError = verifyN8nSecret(request);
  if (authError) return authError;

  const email = "qa-verification@clientflow.local";
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "QA verification account not found." }, { status: 404 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { status: "SUSPENDED" } });

  return NextResponse.json({ success: true, userId: user.id, status: "SUSPENDED" });
}
