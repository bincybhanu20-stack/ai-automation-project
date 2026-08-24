import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requireRole, hashPassword } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/**
 * TEMPORARY, ONE-TIME-USE route. Rotates the passwords of the known
 * prisma/seed.ts demo accounts, which were found to still work with their
 * documented (committed-to-the-repo) passwords on production. Requires an
 * existing ADMIN session (the JWT cookie is signed and re-verified on every
 * request; changing a password here does not invalidate an already-issued
 * cookie, so this doesn't lock out the caller mid-request).
 *
 * Delete this file once the rotation has been run and confirmed.
 */

const SEED_EMAILS = [
  "admin@clientflow.local",
  "manager@clientflow.local",
  "member@clientflow.local",
  "client@clientflow.local",
  "client2@clientflow.local",
];

function generatePassword(): string {
  return randomBytes(18).toString("base64url");
}

export async function POST() {
  try {
    const session = await requireRole(["ADMIN"]);

    const results: Record<string, string> = {};

    for (const email of SEED_EMAILS) {
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!user) continue;

      const newPassword = generatePassword();
      const passwordHash = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      });

      results[email] = newPassword;
    }

    await logAuditEvent({
      userId: session.userId,
      action: "SEED_PASSWORDS_ROTATED",
      entity: "User",
      metadata: { emails: Object.keys(results) },
    });

    return NextResponse.json({ success: true, rotated: results });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    console.error("Failed to rotate seed passwords:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
