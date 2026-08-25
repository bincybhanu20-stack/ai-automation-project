import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { triggerN8nWebhook } from "@/lib/n8n";
import { env } from "@/lib/env";
import type { CreateLeadInput } from "@/lib/validations/leads";

// Same email submitting the same service inquiry within this window is
// almost always a double-click or an accidental resubmit, not a genuinely
// new inquiry (requirement #5, "check for duplicate lead").
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface CreateLeadResult {
  status: "created" | "duplicate";
  leadId: string;
}

/**
 * The public lead-capture pipeline (requirements #5-10). Called only from
 * POST /api/leads after validation has already passed.
 *
 * Order matters here and mirrors the requirement list exactly:
 *   5. duplicate check
 *   6. create Lead record
 *   7. status NEW            (Lead.status defaults to NEW in the schema)
 *   8. source "website"      (passed explicitly below)
 *   9. return success        (the resolved CreateLeadResult)
 *  10. trigger n8n            (only after the `await prisma.lead.create`
 *                              above has actually committed — the database
 *                              write is complete before this line runs)
 */
export async function createLeadFromPublicForm(
  input: CreateLeadInput,
  meta: { ipAddress: string }
): Promise<CreateLeadResult> {
  const existing = await prisma.lead.findFirst({
    where: {
      email: input.email,
      service: input.service || null,
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await logAuditEvent({
      action: "LEAD_DUPLICATE_SUBMISSION",
      entity: "Lead",
      entityId: existing.id,
      ipAddress: meta.ipAddress,
      metadata: { email: input.email, service: input.service || null },
    });
    // Idempotent response: the visitor sees success (their original
    // inquiry IS being handled), and no duplicate row or duplicate
    // automation run is created.
    return { status: "duplicate", leadId: existing.id };
  }

  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      company: input.company || null,
      service: input.service || null,
      budgetRange: input.budget || null,
      message: input.projectDescription,
      source: "WEBSITE",
      // status defaults to NEW in the schema — not set explicitly here so
      // there is exactly one place (prisma/schema.prisma) that defines it.
    },
  });

  await logAuditEvent({
    userId: undefined, // public submission — no authenticated actor
    action: "LEAD_CREATED",
    entity: "Lead",
    entityId: lead.id,
    ipAddress: meta.ipAddress,
    metadata: { source: "WEBSITE", service: lead.service, company: lead.company },
  });

  // The database row above is already committed. Everything from here is
  // best-effort automation — its outcome never changes the result we
  // already have to return to the caller.
  //
  // `body` is the exact shape WF-001's "Normalize Lead Data" node expects
  // (event: "lead.created", lead: {...}) — it reads $json.body.lead.<field>
  // directly, so field names here must match theirs exactly (budget, not
  // budgetRange; projectDescription, not message).
  const executionId = await triggerN8nWebhook({
    eventType: "LEAD_CREATED",
    entityType: "Lead",
    entityId: lead.id,
    payload: {
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      company: lead.company,
      service: lead.service,
      budgetRange: lead.budgetRange,
      source: lead.source,
      createdAt: lead.createdAt,
    },
    body: {
      event: "lead.created",
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone ?? "",
        company: lead.company ?? "",
        service: lead.service ?? "",
        budget: lead.budgetRange ?? "",
        projectDescription: lead.message,
      },
    },
  });

  if (executionId) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { n8nSyncedAt: new Date(), n8nExecutionId: executionId },
    });
  }

  // WF-002 (Lead Notification) is a second, independent n8n workflow from
  // WF-001 (Lead Qualification) — its own webhook, its own AutomationRun
  // row (distinct eventType, so this doesn't overwrite the LEAD_CREATED row
  // above), best-effort same as every other triggerN8nWebhook call site.
  // `body` matches WF-002's "Normalize Lead Data" node exactly: top-level
  // leadId/name/email/company/service/message (not the nested `lead: {}}`
  // shape WF-001 expects).
  await triggerN8nWebhook({
    eventType: "LEAD_NOTIFICATION_SENT",
    entityType: "Lead",
    entityId: lead.id,
    url: env.N8N_LEAD_NOTIFICATION_WEBHOOK_URL || undefined,
    payload: {
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      company: lead.company,
      service: lead.service,
    },
    body: {
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      company: lead.company ?? "",
      service: lead.service ?? "",
      message: lead.message,
    },
  });

  return { status: "created", leadId: lead.id };
}
