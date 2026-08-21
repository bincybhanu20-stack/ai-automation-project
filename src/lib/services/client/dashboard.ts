import { prisma } from "@/lib/prisma";
import { computeProjectProgress } from "@/lib/services/project-progress";

const UPCOMING_DEADLINE_WINDOW_DAYS = 14;
const RECENT_ACTIVITY_LIMIT = 8;
const UPCOMING_DEADLINES_LIMIT = 8;

export interface DeadlineItem {
  kind: "project" | "task";
  id: string;
  title: string;
  dueDate: Date;
  projectId: string;
  projectTitle: string;
}

export type ActivityItem =
  | { kind: "task"; id: string; title: string; status: string; projectId: string; projectTitle: string; at: Date }
  | { kind: "project"; id: string; title: string; status: string; at: Date }
  | { kind: "notification"; id: string; title: string; message: string; at: Date };

/**
 * Everything the client dashboard needs, in one place. Every query below is
 * scoped by the CLIENT record derived from the logged-in user's own id
 * (never by anything passed in from the URL or a form) — this is what makes
 * it structurally impossible for one client to see another client's data,
 * not just a UI-level omission.
 *
 * Task queries use `select`, not `include`, and deliberately never fetch
 * the assignee relation — a client should see WHAT is being worked on, not
 * WHO on the internal team is doing it. That's enforced here, at the data
 * layer, not by hiding a field in a component later.
 */
export async function getClientDashboardData(userId: string) {
  const client = await prisma.client.findUnique({
    where: { userId },
    include: {
      projects: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          progress: true,
          deadline: true,
          updatedAt: true,
          _count: { select: { tasks: true } },
        },
      },
    },
  });

  if (!client) {
    return { client: null };
  }

  const projectIds = client.projects.map((p) => p.id);

  // Same "progress from completed tasks" rule as the admin dashboard
  // (src/lib/services/project-progress.ts) — a client must never see a
  // different percentage than staff sees for the identical project.
  const completedCounts = projectIds.length
    ? await prisma.task.groupBy({
        by: ["projectId"],
        where: { projectId: { in: projectIds }, status: "COMPLETED" },
        _count: true,
      })
    : [];
  const completedMap = new Map(completedCounts.map((c) => [c.projectId, c._count]));

  const projectsWithProgress = client.projects.map((p) => ({
    ...p,
    progress: computeProjectProgress(p.progress, {
      total: p._count.tasks,
      completed: completedMap.get(p.id) ?? 0,
    }),
  }));
  client.projects = projectsWithProgress;

  const activeProjects = client.projects.filter((p) => p.status === "ACTIVE");

  const now = new Date();
  const windowEnd = new Date(now.getTime() + UPCOMING_DEADLINE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [openTasksCount, upcomingTasks, recentTasks, recentNotifications] = await Promise.all([
    prisma.task.count({
      where: { projectId: { in: projectIds }, status: { not: "COMPLETED" } },
    }),
    prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: { not: "COMPLETED" },
        dueDate: { gte: now, lte: windowEnd },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        projectId: true,
        project: { select: { title: true } },
      },
      orderBy: { dueDate: "asc" },
      take: UPCOMING_DEADLINES_LIMIT,
    }),
    prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        projectId: true,
        project: { select: { title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: RECENT_ACTIVITY_LIMIT,
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const upcomingProjectDeadlines = client.projects.filter(
    (p) => p.deadline && p.deadline >= now && p.deadline <= windowEnd && p.status !== "COMPLETED"
  );

  const upcomingDeadlines: DeadlineItem[] = [
    ...upcomingProjectDeadlines.map((p) => ({
      kind: "project" as const,
      id: p.id,
      title: p.title,
      dueDate: p.deadline as Date,
      projectId: p.id,
      projectTitle: p.title,
    })),
    ...upcomingTasks.map((t) => ({
      kind: "task" as const,
      id: t.id,
      title: t.title,
      dueDate: t.dueDate as Date,
      projectId: t.projectId,
      projectTitle: t.project.title,
    })),
  ]
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, UPCOMING_DEADLINES_LIMIT);

  const recentlyUpdatedProjects = client.projects
    .filter((p) => p.id !== undefined)
    .slice() // avoid mutating the array used above
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 3);

  const recentActivity: ActivityItem[] = [
    ...recentTasks.map((t) => ({
      kind: "task" as const,
      id: t.id,
      title: t.title,
      status: t.status,
      projectId: t.projectId,
      projectTitle: t.project.title,
      at: t.updatedAt,
    })),
    ...recentlyUpdatedProjects.map((p) => ({
      kind: "project" as const,
      id: p.id,
      title: p.title,
      status: p.status,
      at: p.updatedAt,
    })),
    ...recentNotifications.map((n) => ({
      kind: "notification" as const,
      id: n.id,
      title: n.title,
      message: n.message,
      at: n.createdAt,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT);

  return {
    client,
    activeProjects,
    openTasksCount,
    upcomingDeadlines,
    recentActivity,
    recentNotifications,
  };
}
