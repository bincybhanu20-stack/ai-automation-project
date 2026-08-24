import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronSecret } from "@/lib/n8n-auth";
import { triggerN8nWebhook } from "@/lib/n8n";

/**
 * GET /api/cron/automation-scan — the one thing nothing in this app was
 * doing before: noticing that time has passed. Everything else in the n8n
 * integration fires from a user action (create a task, submit a message);
 * "this task's due date is now in the past" and "this project's deadline is
 * getting close" are true independent of anyone touching the app, so they
 * need a scan, not an event handler.
 *
 * This route ONLY detects and fires TASK_OVERDUE / PROJECT_DEADLINE_APPROACHING
 * webhook events via the existing src/lib/n8n.ts + AutomationRun pipeline.
 * It deliberately does NOT send reminder emails, Slack messages, or reports
 * itself — that's what n8n workflows WF-004 (Overdue Task Reminder) and
 * WF-005 (Weekly Report) already do, downstream of these events. Duplicating
 * that here would be a second automation system, which the audit and this
 * task both rule out.
 *
 * Scheduled via vercel.json's `crons` entry. Vercel invokes this with GET
 * and (when CRON_SECRET is set) an `Authorization: Bearer <CRON_SECRET>`
 * header automatically — see src/lib/n8n-auth.ts verifyCronSecret().
 *
 * NOTE ON REPEAT FIRING: src/lib/n8n.ts's idempotency key is
 * `${eventType}-${entityId}`, one AutomationRun row per (event, entity)
 * pair. A task that's still overdue tomorrow will fire TASK_OVERDUE again
 * tomorrow (the webhook POST always happens; only the AutomationRun log row
 * is reused/overwritten, not the HTTP call). That's intentional here — an
 * overdue-reminder workflow generally wants to keep nudging until the task
 * is resolved — but it means WF-004 is responsible for its own reminder
 * cadence/throttling if daily re-notification isn't desired.
 */

// How many days out counts as "approaching" — matches the kind of heads-up
// window a project manager would actually want, not an arbitrary number
// hidden behind a magic literal at the call site.
const DEADLINE_APPROACHING_DAYS = 3;

export async function GET(request: Request) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  const now = new Date();

  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: { lt: now },
      status: { not: "COMPLETED" },
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      projectId: true,
      project: { select: { title: true } },
      assigneeId: true,
      assignee: { select: { name: true } },
    },
  });

  for (const task of overdueTasks) {
    const daysOverdue = task.dueDate
      ? Math.floor((now.getTime() - task.dueDate.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    await triggerN8nWebhook({
      eventType: "TASK_OVERDUE",
      entityType: "Task",
      entityId: task.id,
      payload: {
        taskId: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        daysOverdue,
        projectId: task.projectId,
        projectTitle: task.project.title,
        assigneeId: task.assigneeId,
        assigneeName: task.assignee?.name ?? null,
      },
    });
  }

  const approachingWindow = new Date(
    now.getTime() + DEADLINE_APPROACHING_DAYS * 24 * 60 * 60 * 1000
  );

  const approachingProjects = await prisma.project.findMany({
    where: {
      deadline: { gte: now, lte: approachingWindow },
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    select: {
      id: true,
      title: true,
      status: true,
      deadline: true,
      clientId: true,
      client: { select: { companyName: true } },
      managerId: true,
    },
  });

  for (const project of approachingProjects) {
    const daysRemaining = project.deadline
      ? Math.ceil((project.deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    await triggerN8nWebhook({
      eventType: "PROJECT_DEADLINE_APPROACHING",
      entityType: "Project",
      entityId: project.id,
      payload: {
        projectId: project.id,
        title: project.title,
        status: project.status,
        deadline: project.deadline,
        daysRemaining,
        clientId: project.clientId,
        clientName: project.client.companyName,
        managerId: project.managerId,
      },
    });
  }

  return NextResponse.json({
    scannedAt: now.toISOString(),
    overdueTasksFound: overdueTasks.length,
    approachingDeadlinesFound: approachingProjects.length,
  });
}
