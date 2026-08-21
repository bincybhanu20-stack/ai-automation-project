import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { qualifyLeadAI } from "@/lib/ai";
import { triggerN8nWebhook } from "@/lib/n8n";
import type { LeadStatus, Prisma, Role } from "@prisma/client";
import type {
  EditLeadInput,
  createProjectFromLeadSchema,
} from "@/lib/validations/admin-leads";
import type { z } from "zod";

export const LEADS_PAGE_SIZE = 15;

export interface LeadFilters {
  q?: string;
  status?: string;
  source?: string;
  assignedTo?: string; // user id, or "unassigned"
  page?: number;
}

/**
 * The Leads list query: search + filter + pagination, all server-side, all
 * from real Prisma queries. Search matches name, email or company
 * (case-insensitive) — the fields a staff member would actually remember
 * about a lead when looking for it.
 */
export async function getLeads(filters: LeadFilters) {
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.LeadWhereInput = {};

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
      { company: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.status) {
    where.status = filters.status as LeadStatus;
  }
  if (filters.source) {
    where.source = filters.source as Prisma.LeadWhereInput["source"];
  }
  if (filters.assignedTo === "unassigned") {
    where.assignedToId = null;
  } else if (filters.assignedTo) {
    where.assignedToId = filters.assignedTo;
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: { assignedTo: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * LEADS_PAGE_SIZE,
      take: LEADS_PAGE_SIZE,
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    leads,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE)),
  };
}

export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, companyName: true } },
      convertedClient: { select: { id: true, companyName: true } },
      convertedProject: { select: { id: true, title: true } },
      notes: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/** Staff eligible for lead assignment — everyone except CLIENT. */
export async function getAssignableStaff() {
  return prisma.user.findMany({
    where: { role: { in: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"] as Role[] }, status: "ACTIVE" },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function updateLead(
  id: string,
  data: EditLeadInput,
  actorId: string
): Promise<ActionResult> {
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Lead not found." };

  await prisma.lead.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
      service: data.service || null,
      budgetRange: data.budgetRange || null,
      message: data.message,
    },
  });

  await logAuditEvent({
    userId: actorId,
    action: "LEAD_UPDATED",
    entity: "Lead",
    entityId: id,
    metadata: { fields: Object.keys(data) },
  });

  return { success: true };
}

export async function assignLead(
  id: string,
  assigneeId: string | null,
  actorId: string
): Promise<ActionResult> {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return { success: false, error: "Lead not found." };

  await prisma.lead.update({ where: { id }, data: { assignedToId: assigneeId } });

  await logAuditEvent({
    userId: actorId,
    action: "LEAD_ASSIGNED",
    entity: "Lead",
    entityId: id,
    metadata: { assignedToId: assigneeId, previousAssignedToId: lead.assignedToId },
  });

  if (assigneeId) {
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        title: "Lead assigned to you",
        message: `${lead.name}${lead.company ? ` (${lead.company})` : ""} was assigned to you.`,
        type: "INFO",
        entityType: "Lead",
        entityId: id,
      },
    });
  }

  return { success: true };
}

export async function changeLeadStatus(
  id: string,
  status: LeadStatus,
  actorId: string
): Promise<ActionResult> {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return { success: false, error: "Lead not found." };
  if (lead.status === status) return { success: true }; // no-op, not an error

  await prisma.lead.update({ where: { id }, data: { status } });

  await logAuditEvent({
    userId: actorId,
    action: "LEAD_STATUS_CHANGED",
    entity: "Lead",
    entityId: id,
    metadata: { oldStatus: lead.status, newStatus: status },
  });

  return { success: true };
}

/**
 * Runs AI qualification (src/lib/ai.ts — works with or without an OpenAI
 * key configured, falling back to a deterministic rules engine) and writes
 * the result back to the lead. Never overrides a status the team has
 * already moved past NEW/CONTACTED — the AI can suggest a next step, not
 * override a human decision already made (e.g. don't bump a lead back from
 * WON to QUALIFIED because the AI re-scored it).
 */
export async function qualifyLead(id: string, actorId: string): Promise<ActionResult> {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return { success: false, error: "Lead not found." };

  const result = await qualifyLeadAI({
    name: lead.name,
    email: lead.email,
    company: lead.company,
    message: lead.message,
  });

  const shouldAdvanceStatus = lead.status === "NEW" || lead.status === "CONTACTED";

  await prisma.lead.update({
    where: { id },
    data: {
      qualificationScore: result.qualificationScore,
      qualificationSummary: result.qualificationSummary,
      qualificationReason: result.qualificationReason,
      aiProcessedAt: result.aiProcessedAt,
      status: shouldAdvanceStatus ? result.suggestedStatus : lead.status,
    },
  });

  await logAuditEvent({
    userId: actorId,
    action: "LEAD_QUALIFIED",
    entity: "Lead",
    entityId: id,
    metadata: {
      score: result.qualificationScore,
      suggestedStatus: result.suggestedStatus,
      statusAdvanced: shouldAdvanceStatus,
    },
  });

  if (lead.assignedToId) {
    await prisma.notification.create({
      data: {
        userId: lead.assignedToId,
        title: "Lead qualification complete",
        message: `${lead.name} scored ${result.qualificationScore}/100.`,
        type: "INFO",
        entityType: "Lead",
        entityId: id,
      },
    });
  }

  return { success: true };
}

/**
 * Converts a lead into a Client. One-to-one per the schema
 * (Client.convertedFromLeadId is unique) — guarded here so a lead can only
 * ever produce one client record.
 */
export async function convertLeadToClient(id: string, actorId: string): Promise<ActionResult> {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { convertedClient: true },
  });
  if (!lead) return { success: false, error: "Lead not found." };
  if (lead.convertedClient) return { success: false, error: "This lead has already been converted." };

  const client = await prisma.client.create({
    data: {
      companyName: lead.company || lead.name,
      email: lead.email,
      phone: lead.phone,
      convertedFromLeadId: lead.id,
    },
  });

  await prisma.lead.update({ where: { id }, data: { status: "WON" } });

  await logAuditEvent({
    userId: actorId,
    action: "LEAD_CONVERTED",
    entity: "Lead",
    entityId: id,
    metadata: { clientId: client.id, companyName: client.companyName },
  });

  return { success: true };
}

type CreateProjectInput = z.infer<typeof createProjectFromLeadSchema>;

/**
 * Creates a Project from a lead. Project.clientId is required by the
 * schema, so this needs a client to attach to — either the lead's existing
 * client link (repeat business) or the client it was converted into. If
 * neither exists yet, the caller must convert the lead first.
 */
export async function createProjectFromLead(
  id: string,
  data: CreateProjectInput,
  actorId: string
): Promise<ActionResult> {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { convertedClient: true },
  });
  if (!lead) return { success: false, error: "Lead not found." };

  const clientId = lead.clientId ?? lead.convertedClient?.id;
  if (!clientId) {
    return {
      success: false,
      error: "Convert this lead to a client before creating a project for it.",
    };
  }

  const project = await prisma.project.create({
    data: {
      title: data.title,
      description: data.description || null,
      budget: data.budget ?? 0,
      deadline: data.deadline ? new Date(data.deadline) : null,
      clientId,
      managerId: data.managerId || null,
      originatingLeadId: lead.id,
    },
  });

  await logAuditEvent({
    userId: actorId,
    action: "PROJECT_CREATED_FROM_LEAD",
    entity: "Project",
    entityId: project.id,
    metadata: { leadId: lead.id, clientId },
  });

  // Same PROJECT_CREATED event as the standalone creation path
  // (src/lib/services/admin/projects.ts) — "when a project is created
  // successfully" applies here too, not just to projects created directly.
  await triggerN8nWebhook({
    eventType: "PROJECT_CREATED",
    entityType: "Project",
    entityId: project.id,
    payload: {
      projectId: project.id,
      title: project.title,
      clientId: project.clientId,
      managerId: project.managerId,
      status: project.status,
      originatingLeadId: lead.id,
    },
  });

  return { success: true };
}

export async function addLeadNote(id: string, body: string, actorId: string): Promise<ActionResult> {
  const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
  if (!lead) return { success: false, error: "Lead not found." };

  await prisma.leadNote.create({
    data: { leadId: id, authorId: actorId, body },
  });

  await logAuditEvent({
    userId: actorId,
    action: "LEAD_NOTE_ADDED",
    entity: "Lead",
    entityId: id,
  });

  return { success: true };
}
