import { prisma } from "@/lib/prisma";
import { computeProjectProgress } from "@/lib/services/project-progress";

/**
 * Supplementary data for the project detail page. Called AFTER ownership
 * has already been verified by requireProjectAccessForPage() — this
 * function trusts that projectId is safe to query directly, it does not
 * re-check access itself.
 *
 * Tasks are fetched with `select`, never `include` — the assignee relation
 * is deliberately never fetched here, matching the dashboard service
 * (src/lib/services/client/dashboard.ts): a client sees what's being
 * worked on, not which internal staff member is doing it.
 *
 * `storedProgress` is the raw Project.progress value from the already-loaded
 * project (see requireProjectAccessForPage in the calling page) — passed in
 * so this function can apply the same computeProjectProgress() rule the
 * admin dashboard uses, without a second project fetch.
 */
export async function getClientProjectExtras(projectId: string, storedProgress: number) {
  const [milestones, tasks, messages] = await Promise.all([
    prisma.milestone.findMany({
      where: { projectId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.projectMessage.findMany({
      where: { projectId },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const taskSummary = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "TODO").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    review: tasks.filter((t) => t.status === "REVIEW").length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
  };

  const recentUpdates = [...tasks]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 8);

  const computedProgress = computeProjectProgress(storedProgress, {
    total: taskSummary.total,
    completed: taskSummary.completed,
  });

  return { milestones, tasks, taskSummary, messages, recentUpdates, computedProgress };
}
