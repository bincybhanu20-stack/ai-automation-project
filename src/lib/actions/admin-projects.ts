"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { requireProjectManagementAccess } from "@/lib/authorization";
import {
  createProjectSchema,
  updateProjectSchema,
  changeProjectStatusSchema,
  assignProjectManagerSchema,
  assignProjectClientSchema,
} from "@/lib/validations/admin-projects";
import * as projectsService from "@/lib/services/admin/projects";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  projectId?: string;
}

function zodFieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

function revalidateProject(id: string) {
  revalidatePath(`/admin/projects/${id}`);
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  // Status/manager/client changes can also change what a client sees on
  // their own dashboard (a notification, a progress figure) — keep that in
  // sync too rather than leaving it stale until their next hard navigation.
  revalidatePath("/client");
  revalidatePath(`/client/projects/${id}`);
}

/**
 * Creation only needs the ROLE check (ADMIN or PROJECT_MANAGER) — there's no
 * existing project yet to check ownership against. Every other action below
 * re-verifies via requireProjectManagementAccess(), independent of whichever
 * page rendered the control that called it.
 */
export async function createProjectAction(input: unknown): Promise<ActionResult> {
  try {
    const session = await requireRole(["ADMIN", "PROJECT_MANAGER"]);
    const parsed = createProjectSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Please fix the errors below.", fieldErrors: zodFieldErrors(parsed.error.issues) };
    }

    const result = await projectsService.createProject(parsed.data, session.userId, session.role);
    if (result.success) {
      revalidatePath("/admin/projects");
      revalidatePath("/admin");
    }
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function updateProjectAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const { session } = await requireProjectManagementAccess(id);
    const parsed = updateProjectSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Please fix the errors below.", fieldErrors: zodFieldErrors(parsed.error.issues) };
    }

    const result = await projectsService.updateProjectDetails(id, parsed.data, session.userId);
    if (result.success) revalidateProject(id);
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function assignProjectManagerAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const { session } = await requireProjectManagementAccess(id);
    const parsed = assignProjectManagerSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Invalid manager selection." };

    const result = await projectsService.assignProjectManager(id, parsed.data.managerId || null, session.userId);
    if (result.success) revalidateProject(id);
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function assignProjectClientAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const { session } = await requireProjectManagementAccess(id);
    const parsed = assignProjectClientSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Choose a client." };

    const result = await projectsService.assignProjectClient(id, parsed.data.clientId, session.userId);
    if (result.success) revalidateProject(id);
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function changeProjectStatusAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const { session } = await requireProjectManagementAccess(id);
    const parsed = changeProjectStatusSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Invalid status." };

    const result = await projectsService.changeProjectStatus(id, parsed.data.status, session.userId);
    if (result.success) revalidateProject(id);
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

function authErrorResult(err: unknown): ActionResult {
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return { success: false, error: "You're not authorized to perform this action." };
    }
    if (err.message === "NOT_FOUND") {
      return { success: false, error: "That project could not be found." };
    }
  }
  console.error("Admin project action failed:", err);
  return { success: false, error: "Something went wrong. Please try again." };
}
