import { z } from "zod";

/**
 * The service and budget options are defined ONCE here and reused by both
 * the lead form's dropdowns (src/components/leads/LeadCaptureForm.tsx,
 * src/lib/content/services.ts) and this server-side validation — so the
 * dropdown can never offer a value the server would then reject.
 */
export const SERVICE_OPTIONS = [
  "Web & App Development",
  "Client Management Systems",
  "Workflow Automation (n8n)",
  "AI-Powered Lead Qualification",
  "Ongoing Support & Maintenance",
  "Other",
] as const;

export const BUDGET_OPTIONS = [
  "Under $5,000",
  "$5,000 – $15,000",
  "$15,000 – $50,000",
  "$50,000+",
  "Not sure yet",
] as const;

/**
 * Sanitization step (requirement #2): strips control characters (which have
 * no legitimate use in a name/email/description and are sometimes used to
 * smuggle payloads through downstream systems like log files or CSV
 * exports) and trims surrounding whitespace. Runs BEFORE validation via
 * z.preprocess, so what gets validated is already clean.
 *
 * This is deliberately light-touch: Prisma parameterizes every query (no
 * SQL injection risk) and React escapes all output (no XSS risk from
 * rendering this data), so the goal here is data hygiene, not defending
 * against an injection attack that doesn't apply to this stack.
 */
function sanitizeText(value: unknown): unknown {
  if (typeof value !== "string") return value;
  // eslint-disable-next-line no-control-regex -- intentionally stripping control chars
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

/**
 * Lead capture form validation (requirements #1-4).
 *
 * Required: name, email, projectDescription — matches the Lead model's own
 * NOT NULL columns (prisma/schema.prisma), so this schema can never accept
 * something the database would then reject anyway.
 * Optional: phone, company, service, budget — matches the model's nullable
 * columns.
 */
export const createLeadSchema = z.object({
  name: z.preprocess(
    sanitizeText,
    z.string().min(2, "Enter your full name").max(200, "Name is too long")
  ),

  email: z.preprocess(
    sanitizeText,
    z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address")
      .max(254, "Email is too long")
      .transform((value) => value.toLowerCase())
  ),

  phone: z.preprocess(
    sanitizeText,
    z
      .union([
        z
          .string()
          .max(30, "Phone number is too long")
          .regex(/^[0-9+\-()\s]+$/, "Enter a valid phone number"),
        z.literal(""),
      ])
      .optional()
  ),

  company: z.preprocess(
    sanitizeText,
    z.union([z.string().max(200, "Company name is too long"), z.literal("")]).optional()
  ),

  service: z.preprocess(
    sanitizeText,
    z.union([z.enum(SERVICE_OPTIONS), z.literal("")]).optional()
  ),

  budget: z.preprocess(
    sanitizeText,
    z.union([z.enum(BUDGET_OPTIONS), z.literal("")]).optional()
  ),

  projectDescription: z.preprocess(
    sanitizeText,
    z
      .string()
      .min(20, "Tell us a bit more about your project (at least 20 characters)")
      .max(4000, "Project description is too long")
  ),

  // Honeypot field: invisible to real visitors (hidden via CSS in the
  // form), commonly auto-filled by simple bots. Deliberately has NO length
  // or format constraint — this must never fail validation (that would tip
  // off a bot that the field is being checked). The route handler reads
  // its truthiness directly: any non-empty value means "not human," and it
  // silently accepts without writing to the database. Paired with the rate
  // limiter in the route handler as a second, independent layer.
  website: z.string().optional().or(z.literal("")),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
