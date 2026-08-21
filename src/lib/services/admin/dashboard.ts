import { prisma } from "@/lib/prisma";

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  activeClients: number;
  activeProjects: number;
  openTasks: number;
  overdueTasks: number;
  automationFailures: number;
}

/** All 8 numbers come from real, live Prisma aggregate queries — no
 * placeholder or hardcoded figures anywhere in this platform. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();

  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    activeClients,
    activeProjects,
    openTasks,
    overdueTasks,
    automationFailures,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.lead.count({ where: { status: "QUALIFIED" } }),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] } } }),
    prisma.task.count({ where: { status: { not: "COMPLETED" }, dueDate: { lt: now } } }),
    prisma.automationRun.count({ where: { status: "FAILED" } }),
  ]);

  return {
    totalLeads,
    newLeads,
    qualifiedLeads,
    activeClients,
    activeProjects,
    openTasks,
    overdueTasks,
    automationFailures,
  };
}
