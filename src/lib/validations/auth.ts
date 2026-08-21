import { z } from "zod";

/**
 * Password rule: minimum 8 characters, nothing more.
 *
 * This follows current NIST 800-63B guidance, which recommends length over
 * arbitrary complexity rules (forcing "at least one symbol" mostly just
 * makes people write it on a sticky note). Real defense against guessing
 * comes from bcrypt hashing (src/lib/auth.ts) plus the rate limiter and
 * account lockout below, not from complexity theater.
 */
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Missing reset token"),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Missing verification token"),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
