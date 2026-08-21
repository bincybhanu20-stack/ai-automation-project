import { z } from "zod";

function sanitizeText(value: unknown): unknown {
  if (typeof value !== "string") return value;
  // eslint-disable-next-line no-control-regex -- intentionally stripping control chars
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

const TASK_STATUS_VALUES = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"] as const;
const PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

const optionalDate = z.union([z.string().date(), z.literal("")]).optional();
const optionalUuid = z.string().uuid().optional().or(z.literal(""));

export const createTaskSchema = z.object({
  title: z.preprocess(sanitizeText, z.string().min(2, "Enter a task title").max(200)),
  description: z.preprocess(sanitizeText, z.union([z.string().max(2000), z.literal("")]).optional()),
  projectId: z.string().uuid("Choose a project"),
  assigneeId: optionalUuid,
  status: z.enum(TASK_STATUS_VALUES).optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  dueDate: optionalDate,
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.preprocess(sanitizeText, z.string().min(2, "Enter a task title").max(200)),
  description: z.preprocess(sanitizeText, z.union([z.string().max(2000), z.literal("")]).optional()),
  projectId: z.string().uuid("Choose a project"),
  assigneeId: optionalUuid,
  status: z.enum(TASK_STATUS_VALUES),
  priority: z.enum(PRIORITY_VALUES),
  dueDate: optionalDate,
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
