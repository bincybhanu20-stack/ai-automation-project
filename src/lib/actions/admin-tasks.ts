"use server";

import { revalidatePath } from "next/cache";
import { requireTaskManagementAccess, requireProjectManagementAccess } from "@/lib/authorization";
import { createTaskSchema, updateTaskSchema } from "@/lib/validations/admin-tasks";
import * as tasksService from "@/lib/services/admin/tasks";

export interface TaskActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  taskId?: string;
}

function zodFieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

function revalidateTask(id: string, projectId?: string) {
  revalidatePath(`/admin/tasks/${id}`);
  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
  if (projectId) revalidatePath(`/admin/projects/${projectId}`);
}

/**
 * Creation only needs the project-level check (same reasoning as
 * createProjectAction in admin-projects.ts — there's no task yet to check
 * ownership against, only the project it will belong to).
 */
export async function createTaskAction(input: unknown): Promise<TaskActionResult> {
  try {
    const parsed = createTaskSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Please fix the errors below.", fieldErrors: zodFieldErrors(parsed.error.issues) };
    }

    const { session } = await requireProjectManagementAccess(parsed.data.projectId);

    const result = await tasksService.createTask(parsed.data, session.userId);
    if (result.success) {
      revalidatePath("/admin/tasks");
      revalidatePath("/admin");
      revalidatePath(`/admin/projects/${parsed.data.projectId}`);
    }
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function updateTaskAction(id: string, input: unknown): Promise<TaskActionResult> {
  try {
    const { session, task } = await requireTaskManagementAccess(id);
    const parsed = updateTaskSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Please fix the errors below.", fieldErrors: zodFieldErrors(parsed.error.issues) };
    }

    // Changing a task to a different project re-checks management access on
    // the NEW project too — you can't move a task into a project you don't
    // manage.
    if (parsed.data.projectId !== task.projectId) {
      await requireProjectManagementAccess(parsed.data.projectId);
    }

    const result = await tasksService.updateTask(id, parsed.data, session.userId);
    if (result.success) {
      revalidateTask(id, task.projectId);
      if (parsed.data.projectId !== task.projectId) revalidatePath(`/admin/projects/${parsed.data.projectId}`);
    }
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function deleteTaskAction(id: string): Promise<TaskActionResult> {
  try {
    const { session, task } = await requireTaskManagementAccess(id);
    const result = await tasksService.deleteTask(id, session.userId);
    if (result.success) revalidateTask(id, task.projectId);
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

function authErrorResult(err: unknown): TaskActionResult {
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return { success: false, error: "You're not authorized to perform this action." };
    }
    if (err.message === "NOT_FOUND") {
      return { success: false, error: "That task could not be found." };
    }
  }
  console.error("Admin task action failed:", err);
  return { success: false, error: "Something went wrong. Please try again." };
}
