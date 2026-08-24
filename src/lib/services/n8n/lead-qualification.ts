import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import type { LeadQualificationResultInput } from "@/lib/validations/n8n";

/**
 * Saves WF-001's AI qualification result onto the Lead it's about — the
 * write-back half of the outbound LEAD_CREATED webhook (src/lib/services/
 * leads.ts is the read/trigger half). Maps onto Lead's existing
 * qualificationScore/Summary/Reason/aiProcessedAt columns (the same ones
 * the app's own internal qualifyLeadAI already writes via the admin
 * "Qualify" button) so a lead qualified by either path looks the same in
 * the admin UI. `category`, `recommendedAction`, and `aiValid` aren't
 * stored on Lead (no matching columns, and n8n's own "lead_qualification_log"
 * Data Table already keeps the full record) — validated for shape but not
 * persisted, same "don't invent a duplicate architecture" principle as
 * saveProjectAiSummary().
 *
 * Deliberately does NOT touch Lead.status — same reasoning as
 * saveProjectAiSummary() not touching Project.status: this is the AI's
 * restated understanding, not a decision that should silently override
 * whatever a human has already done with the lead.
 */
export async function saveLeadQualificationResult(input: LeadQualificationResultInput) {
  const lead = await prisma.lead.findUnique({ where: { id: input.leadId }, select: { id: true } });
  if (!lead) return null;

  const updated = await prisma.lead.update({
    where: { id: input.leadId },
    data: {
      qualificationScore: input.score,
      qualificationSummary: input.summary,
      qualificationReason: input.reason,
      aiProcessedAt: new Date(),
      n8nExecutionId: input.executionId,
      n8nSyncedAt: new Date(),
    },
    select: { id: true, aiProcessedAt: true },
  });

  await logAuditEvent({
    action: "LEAD_QUALIFIED_BY_N8N",
    entity: "Lead",
    entityId: input.leadId,
    metadata: { score: input.score, category: input.category, aiValid: input.aiValid },
  });

  return updated;
}
