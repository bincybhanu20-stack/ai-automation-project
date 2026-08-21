import { prisma } from "@/lib/prisma";

export const NOTIFICATIONS_PAGE_SIZE = 20;

export async function getNotificationsForUser(userId: string, page = 1) {
  const currentPage = Math.max(1, page);

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * NOTIFICATIONS_PAGE_SIZE,
      take: NOTIFICATIONS_PAGE_SIZE,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page: currentPage,
    totalPages: Math.max(1, Math.ceil(total / NOTIFICATIONS_PAGE_SIZE)),
  };
}

/** Ownership-checked: a user can only mark THEIR OWN notification read —
 * the where clause includes userId, not just the notification id, so this
 * silently no-ops (affects 0 rows) rather than letting one user mark
 * another user's notification, even if they somehow guessed the id. */
export async function markNotificationRead(notificationId: string, userId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
