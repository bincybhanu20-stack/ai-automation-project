import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { triggerN8nWebhook } from "@/lib/n8n";
import { env } from "@/lib/env";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validations/admin-tasks";

export const TASKS_PAGE_SIZE = 15;

interface ActionResult {
  success: boolean;
  error?: string;
}

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

export async function getTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, title: true, managerId: true } },
      assignee: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
    },
  });
}

/** Simple project picker for the task form — every project, not just ones
 * the current staff member manages (matches the leads/projects lists' own
 * "staff see across all clients/projects" baseline — see
 * requireClientAccess()'s comment in authorization.ts). */
export async function getProjectOptions() {
  return prisma.project.findMany({
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });
}

interface CreateTaskResult extends ActionResult {
  taskId?: string;
}

export async function createTask(data: CreateTaskInput, actorId: string): Promise<CreateTaskResult> {
  const project = await prisma.project.findUnique({ where: { id: data.projectId }, select: { id: true, title: true } });
  if (!project) return { success: false, error: "Project not found." };

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      projectId: data.projectId,
      assigneeId: data.assigneeId || null,
      status: data.status ?? "TODO",
      priority: data.priority ?? "MEDIUM",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      creatorId: actorId,
    },
  });

  await logAuditEvent({
    userId: actorId,
    action: "TASK_CREATED",
    entity: "Task",
    entityId: task.id,
    metadata: { projectId: task.projectId, assigneeId: task.assigneeId, status: task.status },
  });

  // The database write above has already committed — everything from here
  // is best-effort automation, same pattern as PROJECT_CREATED
  // (src/lib/services/admin/projects.ts).
  //
  // `body` is the exact shape WF-003's "Normalize Task Data" node expects
  // (event: "task.created", task: {...}) — it reads $json.body.task.<field>
  // directly. WF-003 also requires assigneeEmail, which the task record
  // itself doesn't carry (only assigneeId), so it's looked up below.
  const assignee = task.assigneeId
    ? await prisma.user.findUnique({ where: { id: task.assigneeId }, select: { email: true } })
    : null;

  await triggerN8nWebhook({
    eventType: "TASK_CREATED",
    entityType: "Task",
    entityId: task.id,
    url: env.N8N_TASK_WEBHOOK_URL || undefined,
    payload: {
      taskId: task.id,
      title: task.title,
      projectId: task.projectId,
      projectTitle: project.title,
      assigneeId: task.assigneeId,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    },
    body: {
      event: "task.created",
      task: {
        id: task.id,
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.toISOString() : "",
        assigneeEmail: assignee?.email ?? "",
        projectName: project.title,
      },
    },
  });

  if (task.assigneeId) {
    await prisma.notification.create({
      data: {
        userId: task.assigneeId,
        title: "Task assigned to you",
        message: `"${task.title}" (${project.title}) was assigned to you.`,
        type: "INFO",
        entityType: "Task",
        entityId: task.id,
      },
    });
  }

  return { success: true, taskId: task.id };
}

export async function updateTask(id: string, data: UpdateTaskInput, actorId: string): Promise<ActionResult> {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Task not found." };

  if (data.projectId !== existing.projectId) {
    const project = await prisma.project.findUnique({ where: { id: data.projectId }, select: { id: true } });
    if (!project) return { success: false, error: "Project not found." };
  }

  const wasCompleted = existing.status === "COMPLETED";
  const isNowCompleted = data.status === "COMPLETED";

  await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || null,
      projectId: data.projectId,
      assigneeId: data.assigneeId || null,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      // Set once, on the transition into COMPLETED; cleared if moved back out.
      completedAt: isNowCompleted ? (wasCompleted ? existing.completedAt : new Date()) : null,
    },
  });

  await logAuditEvent({
    userId: actorId,
    action: "TASK_UPDATED",
    entity: "Task",
    entityId: id,
    metadata: { fields: Object.keys(data), oldStatus: existing.status, newStatus: data.status },
  });

  // Fires on every update, not just status changes — the payload's
  // oldStatus/newStatus tells n8n whether this update included a status
  // transition. Note: because src/lib/n8n.ts keys AutomationRun by
  // `${eventType}-${entityId}`, repeated updates to the same task reuse one
  // log row (it always reflects the latest attempt) — see
  // docs/n8n-integration.md for this known idempotency-key behavior.
  await triggerN8nWebhook({
    eventType: "TASK_UPDATED",
    entityType: "Task",
    entityId: id,
    payload: {
      taskId: id,
      title: data.title,
      projectId: data.projectId,
      assigneeId: data.assigneeId || null,
      oldStatus: existing.status,
      newStatus: data.status,
      statusChanged: existing.status !== data.status,
      priority: data.priority,
      dueDate: data.dueDate || null,
    },
  });

  if (data.assigneeId && data.assigneeId !== existing.assigneeId) {
    await prisma.notification.create({
      data: {
        userId: data.assigneeId,
        title: "Task assigned to you",
        message: `"${data.title}" was assigned to you.`,
        type: "INFO",
        entityType: "Task",
        entityId: id,
      },
    });
  }

  return { success: true };
}

/**
 * Hard delete — unlike User, Task has no child records anywhere in the
 * schema (nothing has a foreign key pointing at Task), so there's no
 * relational cleanup to do and no reason to prefer a soft-delete here. The
 * project, client and assignee are all referenced FROM Task (never the
 * other way around), so deleting a task can never cascade into them.
 */
export async function deleteTask(id: string, actorId: string): Promise<ActionResult> {
  const existing = await prisma.task.findUnique({
    where: { id },
    select: { id: true, title: true, projectId: true },
  });
  if (!existing) return { success: false, error: "Task not found." };

  await prisma.task.delete({ where: { id } });

  await logAuditEvent({
    userId: actorId,
    action: "TASK_DELETED",
    entity: "Task",
    entityId: id,
    metadata: { title: existing.title, projectId: existing.projectId },
  });

  return { success: true };
}
