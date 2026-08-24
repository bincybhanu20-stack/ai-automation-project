import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import type { Prisma } from "@prisma/client";
import type { AiProjectSummaryInput } from "@/lib/validations/n8n";

/**
 * Saves WF-010's structured AI summary onto the Project it's about — the
 * write-back half of the n8n integration (src/lib/services/n8n/project-
 * context.ts is the read half). Stores the object exactly as received in
 * Project.aiSummary; nothing here reshapes, recomputes, or reconciles it
 * against the project's own status/progress/priority/deadline, or touches
 * any Task/Milestone/Client row — those stay under the app's own control,
 * not the AI's.
 */
export async function saveProjectAiSummary(
  projectId: string,
  summary: AiProjectSummaryInput
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) return null;

  const generatedAt = new Date();

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      aiSummary: summary as unknown as Prisma.InputJsonValue,
      aiSummaryGeneratedAt: generatedAt,
    },
    select: { id: true, aiSummaryGeneratedAt: true },
  });

  await logAuditEvent({
    action: "PROJECT_AI_SUMMARY_GENERATED",
    entity: "Project",
    entityId: projectId,
    metadata: {
      status: summary.status,
      completionPercentage: summary.progress.completion_percentage,
    },
  });

  return updated;
}
