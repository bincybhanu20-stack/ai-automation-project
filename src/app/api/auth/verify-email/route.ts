import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailSchema } from "@/lib/validations/auth";
import { consumeVerificationToken } from "@/lib/tokens";
import { isSameOriginRequest } from "@/lib/csrf";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing verification token." }, { status: 400 });
  }

  const result = await consumeVerificationToken(parsed.data.token, "EMAIL_VERIFICATION");
  if (!result.valid || !result.userId) {
    const message =
      result.reason === "EXPIRED"
        ? "This verification link has expired."
        : "This verification link is invalid or has already been used.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: result.userId },
    data: { emailVerifiedAt: new Date() },
  });

  await logAuditEvent({
    userId: result.userId,
    action: "EMAIL_VERIFIED",
    entity: "Auth",
    entityId: result.userId,
  });

  return NextResponse.json({ message: "Email verified." });
}
