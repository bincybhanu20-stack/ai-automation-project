import { z } from "zod";

/** Same sanitization approach as the public lead form (src/lib/validations/leads.ts). */
function sanitizeText(value: unknown): unknown {
  if (typeof value !== "string") return value;
  // eslint-disable-next-line no-control-regex -- intentionally stripping control chars
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

const LEAD_STATUS_VALUES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;

export const editLeadSchema = z.object({
  name: z.preprocess(sanitizeText, z.string().min(2, "Enter a name").max(200)),
  email: z.preprocess(
    sanitizeText,
    z.string().email("Enter a valid email address").max(254).transform((v) => v.toLowerCase())
  ),
  phone: z.preprocess(
    sanitizeText,
    z.union([z.string().max(30).regex(/^[0-9+\-()\s]+$/, "Enter a valid phone number"), z.literal("")]).optional()
  ),
  company: z.preprocess(sanitizeText, z.union([z.string().max(200), z.literal("")]).optional()),
  service: z.preprocess(sanitizeText, z.union([z.string().max(100), z.literal("")]).optional()),
  budgetRange: z.preprocess(sanitizeText, z.union([z.string().max(100), z.literal("")]).optional()),
  message: z.preprocess(sanitizeText, z.string().min(1, "Project description is required").max(4000)),
});
export type EditLeadInput = z.infer<typeof editLeadSchema>;

export const assignLeadSchema = z.object({
  // Empty string means "unassign"
  assigneeId: z.string().uuid().optional().or(z.literal("")),
});

export const changeLeadStatusSchema = z.object({
  status: z.enum(LEAD_STATUS_VALUES),
});

export const addLeadNoteSchema = z.object({
  body: z.preprocess(
    sanitizeText,
    z.string().min(1, "Note can't be empty").max(2000, "Note is too long")
  ),
});

export const createProjectFromLeadSchema = z.object({
  title: z.preprocess(sanitizeText, z.string().min(2, "Enter a project title").max(200)),
  description: z.preprocess(sanitizeText, z.union([z.string().max(2000), z.literal("")]).optional()),
  budget: z.coerce.number().min(0, "Budget can't be negative").optional(),
  deadline: z.union([z.string().date(), z.literal("")]).optional(),
  managerId: z.string().uuid().optional().or(z.literal("")),
});
