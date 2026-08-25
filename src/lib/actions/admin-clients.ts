"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { updateClientSchema } from "@/lib/validations/admin-clients";
import * as clientsService from "@/lib/services/admin/clients";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function zodFieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

export async function updateClientAction(id: string, input: unknown): Promise<ActionResult> {
  try {
    const session = await requireRole(["ADMIN"]);
    const parsed = updateClientSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Please fix the errors below.", fieldErrors: zodFieldErrors(parsed.error.issues) };
    }

    const result = await clientsService.updateClient(id, parsed.data, session.userId);
    if (result.success) {
      revalidatePath(`/admin/clients/${id}`);
      revalidatePath("/admin/clients");
    }
    return result;
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return { success: false, error: "You're not authorized to perform this action." };
    }
    console.error("Admin client action failed:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
