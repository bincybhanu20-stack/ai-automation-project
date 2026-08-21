import { prisma } from "@/lib/prisma";

export const TASKS_PAGE_SIZE = 15;

export async function getTasks(params: { q?: string; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const where = params.q ? { title: { contains: params.q, mode: "insensitive" as const } } : {};

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        project: { select: { title: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * TASKS_PAGE_SIZE,
      take: TASKS_PAGE_SIZE,
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, page, totalPages: Math.max(1, Math.ceil(total / TASKS_PAGE_SIZE)) };
}
