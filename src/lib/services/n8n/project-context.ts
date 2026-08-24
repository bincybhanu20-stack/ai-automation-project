/**
 * Builds the normalized "updates" feed for GET /api/n8n/projects/:id/context.
 *
 * There is no ProjectUpdate model in the schema (see docs/28-existing-system-
 * audit.md, section 2). This assembles the same three existing sources the
 * client portal already reads (src/lib/services/client/projects.ts) into one
 * chronological feed, tagged by source type so an n8n workflow (or an AI
 * prompt) can tell a task-status change apart from a client message or a
 * milestone. Every `content` string is built directly from real field
 * values already in the database (title, status, body, description) — none
 * of it is invented.
 *
 * Pure and DB-free by design: the Route Handler does the Prisma fetch and
 * passes plain data in, so this function is unit-testable without a
 * database connection.
 */

export type ProjectUpdateType = "task" | "message" | "milestone";

export interface ProjectUpdateItem {
  type: ProjectUpdateType;
  date: string; // ISO 8601
  content: string;
  entityId: string;
  meta: Record<string, unknown>;
}

export interface TaskUpdateInput {
  id: string;
  title: string;
  status: string;
  updatedAt: Date;
}

export interface MessageUpdateInput {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string; role: string } | null;
}

export interface MilestoneUpdateInput {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface BuildProjectUpdatesFeedParams {
  tasks: TaskUpdateInput[];
  messages: MessageUpdateInput[];
  milestones: MilestoneUpdateInput[];
}

function taskToUpdate(task: TaskUpdateInput): ProjectUpdateItem {
  return {
    type: "task",
    date: task.updatedAt.toISOString(),
    content: `Task "${task.title}" is ${task.status}.`,
    entityId: task.id,
    meta: { status: task.status },
  };
}

function messageToUpdate(message: MessageUpdateInput): ProjectUpdateItem {
  return {
    type: "message",
    date: message.createdAt.toISOString(),
    content: message.body,
    entityId: message.id,
    meta: {
      authorId: message.author?.id ?? null,
      authorName: message.author?.name ?? null,
      authorRole: message.author?.role ?? null,
    },
  };
}

function milestoneToUpdate(milestone: MilestoneUpdateInput): ProjectUpdateItem {
  const date = milestone.completedAt ?? milestone.dueDate ?? milestone.createdAt;
  const content = milestone.completedAt
    ? `Milestone "${milestone.title}" completed.`
    : milestone.dueDate
    ? `Milestone "${milestone.title}" due ${milestone.dueDate.toISOString().slice(0, 10)}.`
    : `Milestone "${milestone.title}" planned.`;

  return {
    type: "milestone",
    date: date.toISOString(),
    content,
    entityId: milestone.id,
    meta: {
      completed: Boolean(milestone.completedAt),
      dueDate: milestone.dueDate ? milestone.dueDate.toISOString() : null,
      description: milestone.description,
    },
  };
}

/** Most recent first — matches the ordering the client portal already uses
 * for its own "recent updates" widget (recentUpdates in
 * src/lib/services/client/projects.ts). */
export function buildProjectUpdatesFeed(
  params: BuildProjectUpdatesFeedParams
): ProjectUpdateItem[] {
  const updates: ProjectUpdateItem[] = [
    ...params.tasks.map(taskToUpdate),
    ...params.messages.map(messageToUpdate),
    ...params.milestones.map(milestoneToUpdate),
  ];

  return updates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
