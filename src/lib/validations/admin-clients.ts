import { z } from "zod";

function sanitizeText(value: unknown): unknown {
  if (typeof value !== "string") return value;
  // eslint-disable-next-line no-control-regex -- intentionally stripping control chars
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

const CLIENT_STATUS_VALUES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const updateClientSchema = z.object({
  companyName: z.preprocess(sanitizeText, z.string().min(2, "Enter a company name").max(200)),
  industry: z.preprocess(sanitizeText, z.union([z.string().max(100), z.literal("")]).optional()),
  phone: z.preprocess(
    sanitizeText,
    z
      .union([z.string().max(30, "Phone number is too long").regex(/^[0-9+\-()\s]+$/, "Enter a valid phone number"), z.literal("")])
      .optional()
  ),
  email: z.preprocess(
    sanitizeText,
    z.union([z.string().email("Enter a valid email address").max(254), z.literal("")]).optional()
  ),
  address: z.preprocess(sanitizeText, z.union([z.string().max(500), z.literal("")]).optional()),
  status: z.enum(CLIENT_STATUS_VALUES),
});
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
