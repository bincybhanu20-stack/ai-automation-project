"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  editLeadSchema,
  assignLeadSchema,
  changeLeadStatusSchema,
  addLeadNoteSchema,
  createProjectFromLeadSchema,
} from "@/lib/validations/admin-leads";
import * as leadsService from "@/lib/services/admin/leads";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Every action here re-checks ADMIN on the server before touching
 * anything — the page that renders the buttons calling these is already
 * gated, but "use server-side authorization" means every mutation gets its
 * own independent check too, not just the page that happens to render its
 * trigger. A non-admin who somehow calls one of these directly (e.g. by
 * replaying a captured request) gets FORBIDDEN, not the mutation.
 */
async function requireAdminActor() {
  const session = await requireRole(["ADMIN"]);
  return session.userId;
}

function zodFieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

function revalidateLead(id: string) {
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

export async function updateLeadAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const actorId = await requireAdminActor();
    const parsed = editLeadSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Please fix the errors below.", fieldErrors: zodFieldErrors(parsed.error.issues) };
    }
    const result = await leadsService.updateLead(id, parsed.data, actorId);
    if (result.success) revalidateLead(id);
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function assignLeadAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const actorId = await requireAdminActor();
    const parsed = assignLeadSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Invalid assignee." };
    const result = await leadsService.assignLead(id, parsed.data.assigneeId || null, actorId);
    if (result.success) revalidateLead(id);
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function changeLeadStatusAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const actorId = await requireAdminActor();
    const parsed = changeLeadStatusSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Invalid status." };
    const result = await leadsService.changeLeadStatus(id, parsed.data.status, actorId);
    if (result.success) revalidateLead(id);
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function qualifyLeadAction(id: string): Promise<ActionResult> {
  try {
    const actorId = await requireAdminActor();
    const result = await leadsService.qualifyLead(id, actorId);
    if (result.success) revalidateLead(id);
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function convertLeadToClientAction(id: string): Promise<ActionResult> {
  try {
    const actorId = await requireAdminActor();
    const result = await leadsService.convertLeadToClient(id, actorId);
    if (result.success) {
      revalidateLead(id);
      revalidatePath("/admin/clients");
    }
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function createProjectFromLeadAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const actorId = await requireAdminActor();
    const parsed = createProjectFromLeadSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Please fix the errors below.", fieldErrors: zodFieldErrors(parsed.error.issues) };
    }
    const result = await leadsService.createProjectFromLead(id, parsed.data, actorId);
    if (result.success) {
      revalidateLead(id);
      revalidatePath("/admin/projects");
    }
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function addLeadNoteAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const actorId = await requireAdminActor();
    const parsed = addLeadNoteSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Please fix the errors below.", fieldErrors: zodFieldErrors(parsed.error.issues) };
    }
    const result = await leadsService.addLeadNote(id, parsed.data.body, actorId);
    if (result.success) revalidateLead(id);
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

function authErrorResult(err: unknown): ActionResult {
  if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
    return { success: false, error: "You're not authorized to perform this action." };
  }
  console.error("Admin lead action failed:", err);
  return { success: false, error: "Something went wrong. Please try again." };
}
