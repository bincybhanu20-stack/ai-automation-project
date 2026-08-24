import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { triggerN8nWebhook } from "@/lib/n8n";
import { computeProjectProgress } from "@/lib/services/project-progress";
import type { ProjectStatus, Role } from "@prisma/client";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/validations/admin-projects";

export const PROJECTS_PAGE_SIZE = 15;

interface ActionResult {
  success: boolean;
  error?: string;
}

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

  // One grouped query for completed-task counts across the whole page,
  // rather than one query per project (N+1) — same approach as the
  // reports dashboard's aggregate queries.
  const projectIds = projects.map((p) => p.id);
  const completedCounts = projectIds.length
    ? await prisma.task.groupBy({
        by: ["projectId"],
        where: { projectId: { in: projectIds }, status: "COMPLETED" },
        _count: true,
      })
    : [];
  const completedMap = new Map(completedCounts.map((c) => [c.projectId, c._count]));

  const projectsWithProgress = projects.map((p) => ({
    ...p,
    computedProgress: computeProjectProgress(p.progress, {
      total: p._count.tasks,
      completed: completedMap.get(p.id) ?? 0,
    }),
  }));

  return {
    projects: projectsWithProgress,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PROJECTS_PAGE_SIZE)),
  };
}

/**
 * Full detail for /admin/projects/[id]: client, manager, tasks (WITH
 * assignee — this is the internal/staff view, unlike the client portal's
 * services which deliberately omit it), milestones, and activity (drawn
 * from AuditLog, filtered to this project — the same durable record every
 * other module's "activity" already uses, not a separate log).
 */
export async function getProjectById(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, companyName: true, status: true } },
      manager: { select: { id: true, name: true, email: true, role: true } },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          completedAt: true,
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      milestones: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
      originatingLead: { select: { id: true, name: true } },
    },
  });

  if (!project) return null;

  const completed = project.tasks.filter((t) => t.status === "COMPLETED").length;
  const computedProgress = computeProjectProgress(project.progress, {
    total: project.tasks.length,
    completed,
  });

  const activity = await prisma.auditLog.findMany({
    where: { entity: "Project", entityId: id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return { ...project, computedProgress, activity };
}

/** Staff eligible to be a project's manager — ADMIN or PROJECT_MANAGER only
 * (unlike lead assignment, which also includes TEAM_MEMBER — a project
 * manager is a distinct responsibility from being assigned a task). */
export async function getProjectManagerCandidates() {
  return prisma.user.findMany({
    where: { role: { in: ["ADMIN", "PROJECT_MANAGER"] as Role[] }, status: "ACTIVE" },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

interface CreateProjectResult extends ActionResult {
  projectId?: string;
}

export async function createProject(
  data: CreateProjectInput,
  actorId: string,
  actorRole: Role
): Promise<CreateProjectResult> {
  // A project manager creating a project always becomes ITS manager — never
  // assigned away from themselves at creation. (If they immediately lost
  // edit rights to what they just created, that would be a confusing,
  // self-defeating default — see canManageProject()'s comment in
  // authorization.ts.) Only ADMIN can pick an arbitrary manager up front.
  const managerId = actorRole === "PROJECT_MANAGER" ? actorId : data.managerId || null;

  const project = await prisma.project.create({
    data: {
      title: data.title,
      description: data.description || null,
      clientId: data.clientId,
      managerId,
      status: data.status ?? "PLANNING",
      priority: data.priority ?? "MEDIUM",
      budget: data.budget ?? 0,
      progress: data.progress ?? 0,
      startDate: data.startDate ? new Date(data.startDate) : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
    },
  });

  await logAuditEvent({
    userId: actorId,
    action: "PROJECT_CREATED",
    entity: "Project",
    entityId: project.id,
    metadata: { clientId: data.clientId, managerId, status: project.status },
  });

  // The database write above has already committed — everything from here
  // is best-effort automation. Fired from this service function, never from
  // a UI component (src/lib/n8n.ts is only ever imported by server code).
  await triggerN8nWebhook({
    eventType: "PROJECT_CREATED",
    entityType: "Project",
    entityId: project.id,
    payload: {
      projectId: project.id,
      title: project.title,
      clientId: project.clientId,
      managerId: project.managerId,
      status: project.status,
    },
  });

  if (managerId) {
    await prisma.notification.create({
      data: {
        userId: managerId,
        title: "Project assigned to you",
        message: `You are now the manager of "${project.title}".`,
        type: "INFO",
        entityType: "Project",
        entityId: project.id,
      },
    });
  }

  return { success: true, projectId: project.id };
}

export async function updateProjectDetails(
  id: string,
  data: UpdateProjectInput,
  actorId: string
): Promise<ActionResult> {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Project not found." };

  await prisma.project.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      budget: data.budget,
      progress: data.progress,
      startDate: data.startDate ? new Date(data.startDate) : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
    },
  });

  await logAuditEvent({
    userId: actorId,
    action: "PROJECT_UPDATED",
    entity: "Project",
    entityId: id,
    metadata: { fields: Object.keys(data) },
  });

  return { success: true };
}

export async function assignProjectManager(
  id: string,
  managerId: string | null,
  actorId: string
): Promise<ActionResult> {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return { success: false, error: "Project not found." };

  await prisma.project.update({ where: { id }, data: { managerId } });

  await logAuditEvent({
    userId: actorId,
    action: "PROJECT_MANAGER_ASSIGNED",
    entity: "Project",
    entityId: id,
    metadata: { managerId, previousManagerId: project.managerId },
  });

  if (managerId) {
    await prisma.notification.create({
      data: {
        userId: managerId,
        title: "Project assigned to you",
        message: `You are now the manager of "${project.title}".`,
        type: "INFO",
        entityType: "Project",
        entityId: id,
      },
    });
  }

  return { success: true };
}

export async function assignProjectClient(
  id: string,
  clientId: string,
  actorId: string
): Promise<ActionResult> {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return { success: false, error: "Project not found." };

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, companyName: true },
  });
  if (!client) return { success: false, error: "Client not found." };

  await prisma.project.update({ where: { id }, data: { clientId } });

  await logAuditEvent({
    userId: actorId,
    action: "PROJECT_CLIENT_REASSIGNED",
    entity: "Project",
    entityId: id,
    metadata: { clientId, previousClientId: project.clientId, companyName: client.companyName },
  });

  return { success: true };
}

export async function changeProjectStatus(
  id: string,
  status: ProjectStatus,
  actorId: string
): Promise<ActionResult> {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return { success: false, error: "Project not found." };
  if (project.status === status) return { success: true }; // no-op, not an error

  await prisma.project.update({ where: { id }, data: { status } });

  await logAuditEvent({
    userId: actorId,
    action: "PROJECT_STATUS_CHANGED",
    entity: "Project",
    entityId: id,
    metadata: { oldStatus: project.status, newStatus: status },
  });

  // Best-effort automation — same pattern as PROJECT_CREATED above. Covers
  // the "project update" / "project status changed" events from the audit
  // (docs/28-existing-system-audit.md, Step 4 table, #5 and #7).
  await triggerN8nWebhook({
    eventType: "PROJECT_UPDATED",
    entityType: "Project",
    entityId: id,
    payload: {
      projectId: id,
      title: project.title,
      clientId: project.clientId,
      managerId: project.managerId,
      oldStatus: project.status,
      newStatus: status,
    },
  });

  // Let the client know — a status change is exactly the kind of update the
  // client portal (previous phase) already has a dashboard/notifications
  // feed ready to surface. Only fires if this client has a portal login.
  const client = await prisma.client.findUnique({
    where: { id: project.clientId },
    select: { userId: true },
  });
  if (client?.userId) {
    await prisma.notification.create({
      data: {
        userId: client.userId,
        title: "Project status updated",
        message: `"${project.title}" is now ${status.replace(/_/g, " ")}.`,
        type: "INFO",
        entityType: "Project",
        entityId: id,
      },
    });
  }

  return { success: true };
}
