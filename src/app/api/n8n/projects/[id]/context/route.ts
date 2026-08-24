import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyN8nSecret } from "@/lib/n8n-auth";
import { buildProjectUpdatesFeed } from "@/lib/services/n8n/project-context";

/**
 * GET /api/n8n/projects/:id/context — authenticated read endpoint for n8n.
 *
 * This is the fix for the Prompt 28 audit finding: an n8n workflow's AI node
 * was referencing {{project}}/{{tasks}}/{{updates}} with no real data source
 * behind them. This endpoint IS that data source — real Prisma data, no
 * placeholders, no fabricated content. n8n's HTTP Request node should call
 * this and feed the response fields into its AI prompt, rather than typing
 * expressions with nothing to resolve against.
 *
 * Auth: server-to-server only (verifyN8nSecret — see src/lib/n8n-auth.ts).
 * This is NOT reachable with a user's session cookie and never will be; it
 * is a separate trust boundary from src/lib/auth.ts by design.
 */

const idSchema = z.string().uuid();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authError = verifyN8nSecret(request);
  if (authError) return authError;

  const parsedId = idSchema.safeParse(params.id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }
  const projectId = parsedId.data;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: {
        select: {
          id: true,
          companyName: true,
          industry: true,
          email: true,
          phone: true,
          status: true,
        },
      },
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const [tasks, messages, milestones] = await Promise.all([
    prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.projectMessage.findMany({
      where: { projectId },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.milestone.findMany({
      where: { projectId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const updates = buildProjectUpdatesFeed({ tasks, messages, milestones });

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      priority: project.priority,
      progress: project.progress,
      budget: project.budget,
      startDate: project.startDate,
      deadline: project.deadline,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      client: project.client,
      manager: project.manager,
    },
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignee: task.assignee,
      creator: task.creator,
    })),
    updates,
  });
}
