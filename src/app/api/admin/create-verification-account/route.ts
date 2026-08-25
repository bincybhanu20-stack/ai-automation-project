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
