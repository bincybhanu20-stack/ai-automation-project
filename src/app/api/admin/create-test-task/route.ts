import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createTask } from "@/lib/services/admin/tasks";
import { prisma } from "@/lib/prisma";

/**
 * TEMPORARY, ONE-TIME-USE route. Creates a real test Task (via the exact
 * same createTask() the admin dashboard's Server Action calls, so
 * TASK_CREATED fires exactly as it would from the real UI) with a past due
 * date, so WF-003 and WF-004 can be tested without a browser to drive the
 * dashboard's forms.
 *
 * Delete this file once the test task has been created and the tests run.
 */
export async function POST() {
  try {
    const session = await requireRole(["ADMIN"]);

    const project = await prisma.project.findFirst({ select: { id: true } });
    if (!project) {
      return NextResponse.json({ error: "No project exists to attach a test task to." }, { status: 404 });
    }

    const assignee = await prisma.user.findFirst({
      where: { role: "TEAM_MEMBER", status: "ACTIVE" },
      select: { id: true, email: true, name: true },
    });
    if (!assignee) {
      return NextResponse.json({ error: "No active TEAM_MEMBER user to assign to." }, { status: 404 });
    }

    const pastDueDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const result = await createTask(
      {
        title: "[TEST] WF-003/WF-004 verification task",
        description: "Temporary test task created by Claude Code to verify TASK_CREATED automation and overdue-task detection. Safe to delete.",
        projectId: project.id,
        assigneeId: assignee.id,
        status: "TODO",
        priority: "LOW",
        dueDate: pastDueDate,
      },
      session.userId
    );

    return NextResponse.json({ ...result, assignee: { id: assignee.id, email: assignee.email, name: assignee.name } });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    console.error("Failed to create test task:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
