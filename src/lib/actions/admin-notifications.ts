"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import * as notificationsService from "@/lib/services/notifications";

export async function markNotificationReadAction(notificationId: string) {
  const session = await requireRole(["ADMIN"]);
  await notificationsService.markNotificationRead(notificationId, session.userId);
  revalidatePath("/admin/notifications");
}

export async function markAllNotificationsReadAction() {
  const session = await requireRole(["ADMIN"]);
  await notificationsService.markAllNotificationsRead(session.userId);
  revalidatePath("/admin/notifications");
}
