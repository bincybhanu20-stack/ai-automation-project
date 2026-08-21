import { prisma } from "@/lib/prisma";

/**
 * Real aggregate metrics computed from the live database — matches the
 * metric list in the platform's own reporting requirements (lead volume,
 * conversion rate, leads by source, project/task completion, automation
 * success rate). No placeholder numbers anywhere here.
 */
export async function getReportMetrics() {
  const now = new Date();

  const [
    leadsByStatus,
    leadsBySource,
    totalLeads,
    wonLeads,
    totalProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    overdueTasks,
    totalAutomationRuns,
    successfulAutomationRuns,
    failedAutomationRuns,
  ] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], _count: true }),
    prisma.lead.groupBy({ by: ["source"], _count: true }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.project.count(),
    prisma.project.count({ where: { status: "COMPLETED" } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: "COMPLETED" } }),
    prisma.task.count({ where: { status: { not: "COMPLETED" }, dueDate: { lt: now } } }),
    prisma.automationRun.count(),
    prisma.automationRun.count({ where: { status: "SUCCESS" } }),
    prisma.automationRun.count({ where: { status: "FAILED" } }),
  ]);

  const pct = (numerator: number, denominator: number) =>
    denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 10;

  return {
    totalLeads,
    wonLeads,
    conversionRate: pct(wonLeads, totalLeads),
    leadsByStatus: leadsByStatus.map((row) => ({ status: row.status, count: row._count })),
    leadsBySource: leadsBySource.map((row) => ({ source: row.source, count: row._count })),
    totalProjects,
    completedProjects,
    projectCompletionRate: pct(completedProjects, totalProjects),
    totalTasks,
    completedTasks,
    taskCompletionRate: pct(completedTasks, totalTasks),
    overdueTasks,
    totalAutomationRuns,
    successfulAutomationRuns,
    failedAutomationRuns,
    automationSuccessRate: pct(successfulAutomationRuns, totalAutomationRuns),
  };
}
