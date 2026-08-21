import { z } from "zod";

function sanitizeText(value: unknown): unknown {
  if (typeof value !== "string") return value;
  // eslint-disable-next-line no-control-regex -- intentionally stripping control chars
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

const ROLE_VALUES = ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "CLIENT"] as const;

// Same length rule as login/reset (src/lib/validations/auth.ts) — length
// over complexity theater, per NIST 800-63B, backed by bcrypt + lockout.
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const createUserSchema = z.object({
  name: z.preprocess(sanitizeText, z.string().min(2, "Enter a full name").max(200)),
  email: z.preprocess(
    sanitizeText,
    z.string().min(1, "Email is required").email("Enter a valid email address").max(254).transform((v) => v.toLowerCase())
  ),
  password: passwordSchema,
  role: z.enum(ROLE_VALUES),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.preprocess(sanitizeText, z.string().min(2, "Enter a full name").max(200)),
  email: z.preprocess(
    sanitizeText,
    z.string().min(1, "Email is required").email("Enter a valid email address").max(254).transform((v) => v.toLowerCase())
  ),
  role: z.enum(ROLE_VALUES),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
