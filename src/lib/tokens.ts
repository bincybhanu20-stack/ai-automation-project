import { randomBytes, createHash } from "crypto";
import { prisma } from "./prisma";
import type { VerificationTokenType } from "@prisma/client";

const RESET_TOKEN_EXPIRY_MINUTES = 60;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

function hashToken(token: string): string {
  // We store only this hash. Even a full database leak can't be used to
  // reset a password or verify an email — the attacker would need the
  // original random token, which only ever existed in the emailed link.
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a new token of the given type for a user and returns the PLAIN
 * token (put this in the emailed link — it is never stored or logged again
 * after this call returns).
 *
 * Any previous unused tokens of the same type for this user are invalidated
 * first, so only the most recently requested link ever works.
 */
export async function createVerificationToken(
  userId: string,
  type: VerificationTokenType
): Promise<string> {
  const plainToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(plainToken);

  const expiresAt = new Date(
    Date.now() +
      (type === "PASSWORD_RESET"
        ? RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
        : VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
  );

  await prisma.$transaction([
    // Invalidate old, unused tokens of this type so only one link is live.
    prisma.verificationToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.verificationToken.create({
      data: { userId, type, tokenHash, expiresAt },
    }),
  ]);

  return plainToken;
}

export interface TokenCheckResult {
  valid: boolean;
  userId?: string;
  reason?: "NOT_FOUND" | "EXPIRED" | "ALREADY_USED";
}

/**
 * Read-only check: is this token still valid? Safe to call from a page on
 * load (e.g. to show "this link has expired") — it never mutates state, so
 * it's safe even if an email client's link-scanner prefetches the URL.
 */
export async function checkVerificationToken(
  plainToken: string,
  type: VerificationTokenType
): Promise<TokenCheckResult> {
  const tokenHash = hashToken(plainToken);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== type) return { valid: false, reason: "NOT_FOUND" };
  if (record.usedAt) return { valid: false, reason: "ALREADY_USED" };
  if (record.expiresAt < new Date()) return { valid: false, reason: "EXPIRED" };

  return { valid: true, userId: record.userId };
}

/**
 * Consumes a token: validates it, then marks it used so it can never be used
 * again. Call this only from the action that actually applies the change
 * (setting the new password / marking the email verified), never from a
 * page's read-only render — a link that mutates state on a GET can be
 * triggered by email prefetchers/scanners before the user ever clicks it.
 */
export async function consumeVerificationToken(
  plainToken: string,
  type: VerificationTokenType
): Promise<TokenCheckResult> {
  const tokenHash = hashToken(plainToken);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== type) return { valid: false, reason: "NOT_FOUND" };
  if (record.usedAt) return { valid: false, reason: "ALREADY_USED" };
  if (record.expiresAt < new Date()) return { valid: false, reason: "EXPIRED" };

  await prisma.verificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { valid: true, userId: record.userId };
}
