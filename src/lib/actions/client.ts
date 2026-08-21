"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { requireProjectAccess } from "@/lib/authorization";
import { submitProjectMessageSchema } from "@/lib/validations/client";
import { createProjectMessage } from "@/lib/services/client/messages";
import { markNotificationRead } from "@/lib/services/notifications";

export interface ClientActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Every client action independently re-verifies BOTH the CLIENT role AND
 * ownership of the specific project being acted on — the page rendering
 * the form is already gated by requireClient() + requireProjectAccess(),
 * but that gate does not make the action's own check redundant. This is
 * also THE test that matters most: a client could otherwise submit a
 * message to a project id that isn't theirs just by editing the request.
 */
export async function submitProjectMessageAction(
  projectId: string,
  input: unknown
): Promise<ClientActionResult> {
  try {
    const session = await requireRole(["CLIENT"]);
    await requireProjectAccess(projectId); // throws FORBIDDEN/NOT_FOUND if not theirs

    const parsed = submitProjectMessageSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Please fix the errors below.",
        fieldErrors: { body: parsed.error.issues[0]?.message ?? "Invalid message" },
      };
    }

    const result = await createProjectMessage(projectId, parsed.data.body, session.userId);
    if (result.success) {
      revalidatePath(`/client/projects/${projectId}`);
    }
    return result;
  } catch (err) {
    return actionErrorResult(err);
  }
}

export async function markClientNotificationReadAction(notificationId: string): Promise<ClientActionResult> {
  try {
    const session = await requireRole(["CLIENT"]);
    await markNotificationRead(notificationId, session.userId);
    revalidatePath("/client");
    return { success: true };
  } catch (err) {
    return actionErrorResult(err);
  }
}

function actionErrorResult(err: unknown): ClientActionResult {
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return { success: false, error: "You're not authorized to do that." };
    }
    if (err.message === "NOT_FOUND") {
      return { success: false, error: "That project could not be found." };
    }
  }
  console.error("Client action failed:", err);
  return { success: false, error: "Something went wrong. Please try again." };
}
