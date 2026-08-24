import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyN8nSecret } from "@/lib/n8n-auth";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * GET /api/reports/weekly-stats — data source for WF-005's "Fetch Weekly
 * Statistics" node, which was previously a placeholder URL
 * (docs/n8n-integration.md). WF-005 runs weekly, so every count below is
 * either "in the last 7 days" (activity) or a current snapshot (state) —
 * matching how "active clients"/"open tasks" etc. read naturally.
 *
 * Response shape: a single JSON object with exactly the 11 numeric fields
 * WF-005's "Normalize Weekly Stats" node reads off `$json` directly.
 *
 * Auth: verifyN8nSecret — same shared secret/header as every other n8n ->
 * app endpoint (src/lib/n8n-auth.ts).
 */
export async function GET(request: Request) {
  const authError = verifyN8nSecret(request);
  if (authError) return authError;

  const since = new Date(Date.now() - WEEK_MS);
  const now = new Date();

  try {
    const [
      newLeads,
      qualifiedLeads,
      wonLeads,
      lostLeads,
      activeClients,
      activeProjects,
      completedProjects,
      openTasks,
      completedTasks,
      overdueTasks,
      automationFailures,
    ] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: since } } }),
      prisma.lead.count({ where: { aiProcessedAt: { gte: since }, qualificationScore: { not: null } } }),
      prisma.lead.count({ where: { status: "WON", updatedAt: { gte: since } } }),
      prisma.lead.count({ where: { status: "LOST", updatedAt: { gte: since } } }),
      prisma.client.count({ where: { status: "ACTIVE" } }),
      prisma.project.count({ where: { status: "ACTIVE" } }),
      prisma.project.count({ where: { status: "COMPLETED", updatedAt: { gte: since } } }),
      prisma.task.count({ where: { status: { not: "COMPLETED" } } }),
      prisma.task.count({ where: { status: "COMPLETED", completedAt: { gte: since } } }),
      prisma.task.count({ where: { dueDate: { lt: now }, status: { not: "COMPLETED" } } }),
      prisma.automationRun.count({ where: { status: "FAILED", startedAt: { gte: since } } }),
    ]);

    return NextResponse.json({
      newLeads,
      qualifiedLeads,
      wonLeads,
      lostLeads,
      activeClients,
      activeProjects,
      completedProjects,
      openTasks,
      completedTasks,
      overdueTasks,
      automationFailures,
    });
  } catch (error) {
    console.error("Failed to fetch weekly stats:", error);
    return NextResponse.json({ error: "Something went wrong on our end." }, { status: 500 });
  }
}
