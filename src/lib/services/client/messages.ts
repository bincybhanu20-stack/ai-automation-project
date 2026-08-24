import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { triggerN8nWebhook } from "@/lib/n8n";

interface CreateMessageResult {
  success: boolean;
  error?: string;
}

/**
 * The "submit project requests/messages" feature. Notifies the project's
 * manager (if one is assigned) so a real message doesn't sit unseen — same
 * pattern as lead assignment notifications in the admin dashboard.
 *
 * Note: this builds the client-facing half fully (submit + view your own
 * project's message thread). A staff-facing inbox/reply UI is future work,
 * scoped out here the same way full client/project/task CRUD was scoped
 * out of the admin dashboard build — this task is the client portal.
 */
export async function createProjectMessage(
  projectId: string,
  body: string,
  authorId: string
): Promise<CreateMessageResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { managerId: true, title: true },
  });
  if (!project) return { success: false, error: "Project not found." };

  const message = await prisma.projectMessage.create({ data: { projectId, authorId, body } });

  await logAuditEvent({
    userId: authorId,
    action: "PROJECT_MESSAGE_SUBMITTED",
    entity: "Project",
    entityId: projectId,
  });

  // This function is only ever called from a requireRole(["CLIENT"])-gated
  // action (src/lib/actions/client.ts submitProjectMessageAction) — every
  // author here is a client, so this is exactly the "client feedback"
  // event from the audit's Step 4 table (#9). Best-effort, same pattern as
  // every other triggerN8nWebhook call site.
  await triggerN8nWebhook({
    eventType: "CLIENT_FEEDBACK",
    entityType: "ProjectMessage",
    entityId: message.id,
    payload: {
      messageId: message.id,
      projectId,
      projectTitle: project.title,
      authorId,
      body,
    },
  });

  if (project.managerId) {
    await prisma.notification.create({
      data: {
        userId: project.managerId,
        title: "New client message",
        message: `New message on "${project.title}".`,
        type: "INFO",
        entityType: "Project",
        entityId: projectId,
      },
    });
  }

  return { success: true };
}
