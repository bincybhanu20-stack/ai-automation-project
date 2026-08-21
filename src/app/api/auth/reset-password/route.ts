import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { consumeVerificationToken } from "@/lib/tokens";
import { hashPassword } from "@/lib/auth";
import { isSameOriginRequest } from "@/lib/csrf";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Invalid submission.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const result = await consumeVerificationToken(parsed.data.token, "PASSWORD_RESET");
  if (!result.valid || !result.userId) {
    const message =
      result.reason === "EXPIRED"
        ? "This reset link has expired. Request a new one."
        : "This reset link is invalid or has already been used.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.user.update({
    where: { id: result.userId },
    data: {
      passwordHash,
      // A password reset is a legitimate reason to clear any lockout too —
      // the person proved account ownership via their email inbox.
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await logAuditEvent({
    userId: result.userId,
    action: "PASSWORD_RESET",
    entity: "Auth",
    entityId: result.userId,
  });

  return NextResponse.json({ message: "Password updated. You can now log in." });
}
