import { prisma } from "@/lib/prisma";
import type { AutomationRunStatus } from "@prisma/client";

export const AUTOMATIONS_PAGE_SIZE = 20;

export async function getAutomationRuns(params: { status?: string; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const where = params.status ? { status: params.status as AutomationRunStatus } : {};

  const [runs, total] = await Promise.all([
    prisma.automationRun.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * AUTOMATIONS_PAGE_SIZE,
      take: AUTOMATIONS_PAGE_SIZE,
    }),
    prisma.automationRun.count({ where }),
  ]);

  return { runs, total, page, totalPages: Math.max(1, Math.ceil(total / AUTOMATIONS_PAGE_SIZE)) };
}
