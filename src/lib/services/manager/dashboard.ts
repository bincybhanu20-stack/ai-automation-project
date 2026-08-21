import { prisma } from "@/lib/prisma";

/**
 * Everything is scoped to THIS staff member (managerId / assigneeId /
 * userId = the logged-in session's id), never platform-wide — /manager is
 * reachable by TEAM_MEMBER too, who shouldn't see company-wide figures
 * (that's the ADMIN-only /admin dashboard). Same real-data rule as every
 * other dashboard in this platform: no placeholder numbers.
 */
export async function getManagerDashboardData(userId: string) {
  const now = new Date();
  const twoWeeksOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [
    projectsManaged,
    tasksAssigned,
    overdueTasks,
    unreadNotifications,
    tasksByStatus,
    projectsByStatus,
    upcomingDeadlines,
    recentNotifications,
  ] = await Promise.all([
    prisma.project.count({ where: { managerId: userId } }),
    prisma.task.count({ where: { assigneeId: userId, status: { not: "COMPLETED" } } }),
    prisma.task.count({ where: { assigneeId: userId, status: { not: "COMPLETED" }, dueDate: { lt: now } } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.task.groupBy({ by: ["status"], _count: true, where: { assigneeId: userId } }),
    prisma.project.groupBy({ by: ["status"], _count: true, where: { managerId: userId } }),
    prisma.task.findMany({
      where: { assigneeId: userId, status: { not: "COMPLETED" }, dueDate: { gte: now, lte: twoWeeksOut } },
      select: { id: true, title: true, dueDate: true, project: { select: { id: true, title: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    projectsManaged,
    tasksAssigned,
    overdueTasks,
    unreadNotifications,
    tasksByStatus: tasksByStatus.map((row) => ({ status: row.status, count: row._count })),
    projectsByStatus: projectsByStatus.map((row) => ({ status: row.status, count: row._count })),
    upcomingDeadlines,
    recentNotifications,
  };
}
