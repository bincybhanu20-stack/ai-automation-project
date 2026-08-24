import { z } from "zod";

/**
 * Validates the body of POST /api/n8n/projects/:id/summary — the exact
 * structured output WF-010 already produces (see docs/n8n-integration.md).
 * Kept intentionally minimal: this is a machine-generated payload from a
 * trusted, authenticated caller (verifyN8nSecret), not free-text user input,
 * so there's no sanitization step here the way src/lib/validations/leads.ts
 * has for browser form fields.
 */

export const aiProjectSummaryProgressSchema = z.object({
  total_tasks: z.number().int().min(0),
  completed_tasks: z.number().int().min(0),
  in_progress_tasks: z.number().int().min(0),
  pending_tasks: z.number().int().min(0),
  overdue_tasks: z.number().int().min(0),
  completion_percentage: z.number().int().min(0).max(100),
});

export const aiProjectSummarySchema = z.object({
  project_summary: z.string().min(1),
  status: z.string().min(1),
  progress: aiProjectSummaryProgressSchema,
  key_updates: z.array(z.string()),
  risks: z.array(z.string()),
  upcoming_deadlines: z.array(z.string()),
  recommended_actions: z.array(z.string()),
});

export type AiProjectSummaryInput = z.infer<typeof aiProjectSummarySchema>;
