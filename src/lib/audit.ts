import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export interface AuditEventParams {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
}

export async function logAuditEvent(params: AuditEventParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        metadata: params.metadata ?? undefined,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
