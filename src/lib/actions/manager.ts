"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { markNotificationRead } from "@/lib/services/notifications";

export interface ManagerActionResult {
  success: boolean;
  error?: string;
}

/**
 * Mirrors markClientNotificationReadAction (src/lib/actions/client.ts) —
 * same shared, ownership-checked service (src/lib/services/notifications.ts
 * verifies the notification actually belongs to this session's userId
 * before updating anything), just scoped to the staff roles that reach
 * /manager instead of CLIENT.
 */
export async function markManagerNotificationReadAction(notificationId: string): Promise<ManagerActionResult> {
  try {
    const session = await requireRole(["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"]);
    await markNotificationRead(notificationId, session.userId);
    revalidatePath("/manager");
    return { success: true };
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return { success: false, error: "You're not authorized to do that." };
    }
    console.error("Manager action failed:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
