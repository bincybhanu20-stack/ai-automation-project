import { z } from "zod";

function sanitizeText(value: unknown): unknown {
  if (typeof value !== "string") return value;
  // eslint-disable-next-line no-control-regex -- intentionally stripping control chars
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

const PROJECT_STATUS_VALUES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;
const PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

const optionalDate = z.union([z.string().date(), z.literal("")]).optional();
const optionalUuid = z.string().uuid().optional().or(z.literal(""));

export const createProjectSchema = z.object({
  title: z.preprocess(sanitizeText, z.string().min(2, "Enter a project title").max(200)),
  description: z.preprocess(sanitizeText, z.union([z.string().max(2000), z.literal("")]).optional()),
  clientId: z.string().uuid("Choose a client"),
  managerId: optionalUuid,
  status: z.enum(PROJECT_STATUS_VALUES).optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  budget: z.coerce.number().min(0, "Budget can't be negative").optional(),
  progress: z.coerce.number().int().min(0).max(100).optional(),
  startDate: optionalDate,
  deadline: optionalDate,
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  title: z.preprocess(sanitizeText, z.string().min(2, "Enter a project title").max(200)),
  description: z.preprocess(sanitizeText, z.union([z.string().max(2000), z.literal("")]).optional()),
  priority: z.enum(PRIORITY_VALUES),
  budget: z.coerce.number().min(0, "Budget can't be negative"),
  progress: z.coerce.number().int().min(0, "Progress must be 0-100").max(100, "Progress must be 0-100"),
  startDate: optionalDate,
  deadline: optionalDate,
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const changeProjectStatusSchema = z.object({
  status: z.enum(PROJECT_STATUS_VALUES),
});

export const assignProjectManagerSchema = z.object({
  managerId: optionalUuid, // empty = unassign
});

export const assignProjectClientSchema = z.object({
  clientId: z.string().uuid("Choose a client"),
});
