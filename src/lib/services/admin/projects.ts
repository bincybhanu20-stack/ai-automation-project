import { prisma } from "@/lib/prisma";

export const PROJECTS_PAGE_SIZE = 15;

export async function getProjects(params: { q?: string; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const where = params.q ? { title: { contains: params.q, mode: "insensitive" as const } } : {};

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        client: { select: { companyName: true } },
        manager: { select: { name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PROJECTS_PAGE_SIZE,
      take: PROJECTS_PAGE_SIZE,
    }),
    prisma.project.count({ where }),
  ]);

  return { projects, total, page, totalPages: Math.max(1, Math.ceil(total / PROJECTS_PAGE_SIZE)) };
}
