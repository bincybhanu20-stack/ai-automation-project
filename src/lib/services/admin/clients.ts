import { prisma } from "@/lib/prisma";

export const CLIENTS_PAGE_SIZE = 15;

export async function getClients(params: { q?: string; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const where = params.q
    ? { companyName: { contains: params.q, mode: "insensitive" as const } }
    : {};

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: { _count: { select: { projects: true } }, user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * CLIENTS_PAGE_SIZE,
      take: CLIENTS_PAGE_SIZE,
    }),
    prisma.client.count({ where }),
  ]);

  return { clients, total, page, totalPages: Math.max(1, Math.ceil(total / CLIENTS_PAGE_SIZE)) };
}
