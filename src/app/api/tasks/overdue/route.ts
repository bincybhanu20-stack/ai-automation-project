import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyN8nSecret } from "@/lib/n8n-auth";

/**
 * GET /api/tasks/overdue — data source for WF-004's "Fetch Overdue Tasks"
 * node, which was previously a placeholder URL (docs/n8n-integration.md).
 *
 * Response shape: a plain JSON array (n8n's HTTP Request node auto-splits a
 * top-level array response into one execution item per element, which is
 * what WF-004's "Normalize Task Fields" node expects to iterate over) of
 * `{ id, title, project, dueDate, status, assigneeEmail, assigneeName }` —
 * exactly the fields that node reads off each item.
 *
 * Auth: verifyN8nSecret — same shared secret/header as every other n8n ->
 * app endpoint (src/lib/n8n-auth.ts).
 */
export async function GET(request: Request) {
  const authError = verifyN8nSecret(request);
  if (authError) return authError;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { not: "COMPLETED" },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        project: { select: { title: true } },
        assignee: { select: { name: true, email: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        project: task.project.title,
        dueDate: task.dueDate,
        status: task.status,
        assigneeEmail: task.assignee?.email ?? "",
        assigneeName: task.assignee?.name ?? "",
      }))
    );
  } catch (error) {
    console.error("Failed to fetch overdue tasks:", error);
    return NextResponse.json({ error: "Something went wrong on our end." }, { status: 500 });
  }
}
