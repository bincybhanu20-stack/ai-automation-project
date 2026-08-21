"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createUserSchema, updateUserSchema } from "@/lib/validations/admin-users";
import * as usersService from "@/lib/services/admin/users";

export interface UserActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  userId?: string;
}

function zodFieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

function revalidateUsers(id?: string) {
  if (id) revalidatePath(`/admin/users/${id}`);
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

/** Only ADMIN — never PROJECT_MANAGER — may create, edit, deactivate or
 * reactivate a user. This is deliberately narrower than the Task/Project
 * actions above; user/role management is not delegated. */
export async function createUserAction(input: unknown): Promise<UserActionResult> {
  try {
    const session = await requireRole(["ADMIN"]);
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Please fix the errors below.", fieldErrors: zodFieldErrors(parsed.error.issues) };
    }

    const result = await usersService.createUser(parsed.data, session.userId);
    if (result.success) revalidateUsers();
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function updateUserAction(id: string, input: unknown): Promise<UserActionResult> {
  try {
    const session = await requireRole(["ADMIN"]);
    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Please fix the errors below.", fieldErrors: zodFieldErrors(parsed.error.issues) };
    }

    const result = await usersService.updateUser(id, parsed.data, session.userId);
    if (result.success) revalidateUsers(id);
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function deactivateUserAction(id: string): Promise<UserActionResult> {
  try {
    const session = await requireRole(["ADMIN"]);
    const result = await usersService.deactivateUser(id, session.userId);
    if (result.success) revalidateUsers(id);
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

export async function reactivateUserAction(id: string): Promise<UserActionResult> {
  try {
    const session = await requireRole(["ADMIN"]);
    const result = await usersService.reactivateUser(id, session.userId);
    if (result.success) revalidateUsers(id);
    return result;
  } catch (err) {
    return authErrorResult(err);
  }
}

function authErrorResult(err: unknown): UserActionResult {
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return { success: false, error: "You're not authorized to perform this action." };
    }
    if (err.message === "NOT_FOUND") {
      return { success: false, error: "That user could not be found." };
    }
  }
  console.error("Admin user action failed:", err);
  return { success: false, error: "Something went wrong. Please try again." };
}
