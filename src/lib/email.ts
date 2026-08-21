/**
 * Email sending abstraction.
 *
 * No email provider is configured yet (no SMTP/Resend/SendGrid credentials
 * exist in this project's .env). Rather than block password reset and email
 * verification on that missing piece, this follows the same pattern already
 * used in src/lib/ai.ts: the real logic is fully built and testable, and
 * delivery falls back to a clearly-labelled console log in development.
 *
 * To go live: implement sendEmail() using your provider's SDK, add its API
 * key to .env (never commit it), and nothing else in this file's callers
 * needs to change.
 */

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
}

async function sendEmail({ to, subject, body }: SendEmailParams): Promise<void> {
  // Development fallback: print the email instead of sending it. This is
  // genuinely useful, not just a stub — it's how you get the reset/verify
  // link to test with, since there's no real inbox in local development.
  console.log("\n--- EMAIL (no provider configured, printed instead) ---");
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(body);
  console.log("--- END EMAIL ---\n");
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  await sendEmail({
    to,
    subject: "Reset your ClientFlow password",
    body:
      `Hi ${name},\n\n` +
      `We received a request to reset your ClientFlow password. This link expires in 1 hour:\n\n` +
      `${resetUrl}\n\n` +
      `If you didn't request this, you can safely ignore this email — your password won't change.`,
  });
}

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  await sendEmail({
    to,
    subject: "Verify your ClientFlow email address",
    body:
      `Hi ${name},\n\n` +
      `Please confirm your email address by visiting this link (valid for 24 hours):\n\n` +
      `${verifyUrl}\n\n` +
      `If you didn't create this account, you can ignore this email.`,
  });
}
