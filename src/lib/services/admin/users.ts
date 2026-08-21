import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import type { Prisma, Role } from "@prisma/client";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/admin-users";

export const USERS_PAGE_SIZE = 15;

interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

// Never select passwordHash here or anywhere else in this file — nothing in
// this module should ever be able to leak a hash to the client, even by
// accident (e.g. a future `...user` spread on a query result).
const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

export interface UserFilters {
  q?: string;
  role?: Role;
  page?: number;
}

export async function getUsers(filters: UserFilters) {
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.UserWhereInput = {};
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.role) {
    where.role = filters.role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * USERS_PAGE_SIZE,
      take: USERS_PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, totalPages: Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)) };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: SAFE_USER_SELECT });
  if (!user) return null;

  // Real counts, not a guess — shown so an admin can see the blast radius
  // before deactivating someone (per the "check whether the user is
  // assigned to tasks or projects" requirement).
  const [assignedTaskCount, managedProjectCount, assignedLeadCount] = await Promise.all([
    prisma.task.count({ where: { assigneeId: id } }),
    prisma.project.count({ where: { managerId: id } }),
    prisma.lead.count({ where: { assignedToId: id } }),
  ]);

  return { ...user, assignedTaskCount, managedProjectCount, assignedLeadCount };
}

export async function createUser(data: CreateUserInput, actorId: string): Promise<ActionResult & { userId?: string }> {
  const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (existing) {
    return {
      success: false,
      error: "A user with this email already exists.",
      fieldErrors: { email: "This email is already in use." },
    };
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      emailVerifiedAt: new Date(), // admin-created accounts are pre-verified — no self-serve verification loop needed
    },
    select: SAFE_USER_SELECT,
  });

  await logAuditEvent({
    userId: actorId,
    action: "USER_CREATED",
    entity: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  return { success: true, userId: user.id };
}

export async function updateUser(id: string, data: UpdateUserInput, actorId: string): Promise<ActionResult> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "User not found." };

  // Server-side, not just a disabled form field (per this feature's own
  // "never let client-side state control roles" rule) — an admin can't
  // change their own role, so they can never accidentally lock themselves
  // out of the admin panel.
  if (id === actorId && data.role !== existing.role) {
    return { success: false, error: "You can't change your own role.", fieldErrors: { role: "You can't change your own role." } };
  }

  if (data.email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
    if (emailTaken) {
      return {
        success: false,
        error: "A user with this email already exists.",
        fieldErrors: { email: "This email is already in use." },
      };
    }
  }

  await prisma.user.update({
    where: { id },
    data: { name: data.name, email: data.email, role: data.role },
  });

  await logAuditEvent({
    userId: actorId,
    action: "USER_UPDATED",
    entity: "User",
    entityId: id,
    metadata: {
      fields: Object.keys(data),
      oldRole: existing.role,
      newRole: data.role,
    },
  });

  return { success: true };
}

/**
 * "Delete" a user = deactivate (status: SUSPENDED), not a hard database
 * delete. This is the platform's EXISTING account-lifecycle mechanism —
 * already enforced at login (src/app/api/auth/login/route.ts blocks
 * SUSPENDED accounts with a 403) — not new behavior invented for this
 * feature. It keeps every historical Task/Project/Lead/AuditLog record
 * intact (all of them reference User with onDelete: SetNull specifically so
 * that history survives account changes) while fully preventing the account
 * from being used.
 */
export async function deactivateUser(id: string, actorId: string): Promise<ActionResult> {
  if (id === actorId) {
    return { success: false, error: "You can't deactivate your own account." };
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "User not found." };
  if (existing.status === "SUSPENDED") return { success: true }; // no-op, not an error

  await prisma.user.update({ where: { id }, data: { status: "SUSPENDED" } });

  await logAuditEvent({
    userId: actorId,
    action: "USER_DEACTIVATED",
    entity: "User",
    entityId: id,
    metadata: { email: existing.email },
  });

  return { success: true };
}

export async function reactivateUser(id: string, actorId: string): Promise<ActionResult> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "User not found." };
  if (existing.status === "ACTIVE") return { success: true };

  await prisma.user.update({
    where: { id },
    data: { status: "ACTIVE", failedLoginAttempts: 0, lockedUntil: null },
  });

  await logAuditEvent({
    userId: actorId,
    action: "USER_REACTIVATED",
    entity: "User",
    entityId: id,
    metadata: { email: existing.email },
  });

  return { success: true };
}
