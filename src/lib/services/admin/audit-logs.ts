import { prisma } from "@/lib/prisma";

export const AUDIT_LOGS_PAGE_SIZE = 25;

export async function getAuditLogs(params: { entity?: string; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const where = params.entity ? { entity: params.entity } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * AUDIT_LOGS_PAGE_SIZE,
      take: AUDIT_LOGS_PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, totalPages: Math.max(1, Math.ceil(total / AUDIT_LOGS_PAGE_SIZE)) };
}

/** Distinct entity values currently in the log, used to populate the filter
 * dropdown with only options that actually have data — never a hardcoded
 * list that could show empty filter results. */
export async function getAuditLogEntityTypes(): Promise<string[]> {
  const rows = await prisma.auditLog.findMany({
    distinct: ["entity"],
    select: { entity: true },
    orderBy: { entity: "asc" },
  });
  return rows.map((r) => r.entity);
}
