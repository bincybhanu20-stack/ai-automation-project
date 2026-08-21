import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requestPasswordResetSchema } from "@/lib/validations/auth";
import { createVerificationToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/csrf";
import { env } from "@/lib/env";

// Always returns the same generic success message, whether or not the email
// belongs to an account. Confirming "that email doesn't exist" lets an
// attacker enumerate real accounts one guess at a time — never do that.
const GENERIC_MESSAGE =
  "If an account exists for that email, a password reset link has been sent.";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const ip = getClientIp(request);
  const limit = checkRateLimit(`forgot-password:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestPasswordResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (user) {
    const token = await createVerificationToken(user.id, "PASSWORD_RESET");
    const resetUrl = `${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password/${token}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
