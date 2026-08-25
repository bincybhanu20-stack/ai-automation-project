import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { computeProjectProgress } from "@/lib/services/project-progress";
import type { UpdateClientInput } from "@/lib/validations/admin-clients";

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

/** Simple list for a client picker (e.g. assigning/reassigning a project). */
export async function getClientOptions() {
  return prisma.client.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, companyName: true },
    orderBy: { companyName: "asc" },
  });
}

/**
 * Full detail for /admin/clients/[id]: the client's own record, its portal
 * login (if any), its projects (with the same computed-progress rule every
 * other project list/detail view uses), and the lead it was converted from
 * (if any) — so staff can see the whole relationship in one place without
 * a separate create-client path (see docs: clients are created only via
 * lead conversion, this page is view/edit only).
 */
export async function getClientById(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, status: true } },
      convertedFromLead: { select: { id: true, name: true } },
      projects: {
        select: {
          id: true,
          title: true,
          status: true,
          progress: true,
          deadline: true,
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!client) return null;

  const projectIds = client.projects.map((p) => p.id);
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
    computedProgress: computeProjectProgress(p.progress, {
      total: p._count.tasks,
      completed: completedMap.get(p.id) ?? 0,
    }),
  }));

  return { ...client, projects: projectsWithProgress };
}

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Edits the client's own record — company/contact details and status.
 * Deliberately does NOT touch userId/convertedFromLeadId/projects: portal
 * login and lead-conversion lineage are set exactly once, at conversion
 * time (convertLeadToClient(), src/lib/services/admin/leads.ts), never
 * reassigned from here.
 */
export async function updateClient(id: string, data: UpdateClientInput, actorId: string): Promise<ActionResult> {
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Client not found." };

  await prisma.client.update({
    where: { id },
    data: {
      companyName: data.companyName,
      industry: data.industry || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      status: data.status,
    },
  });

  await logAuditEvent({
    userId: actorId,
    action: "CLIENT_UPDATED",
    entity: "Client",
    entityId: id,
    metadata: { fields: Object.keys(data) },
  });

  return { success: true };
}
