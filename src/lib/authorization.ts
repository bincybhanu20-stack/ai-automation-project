import { prisma } from "./prisma";
import { requireAuth, requireRole, type AuthSession } from "./auth";
import type { Project, Task } from "@prisma/client";

/**
 * Resource-ownership checks.
 *
 * Split out from auth.ts because these need Prisma (a database round trip),
 * while auth.ts only needs the signed cookie. That split also documents a
 * real boundary: auth.ts (identity) could run on the Edge runtime, this file
 * (authorization) needs the Node runtime because Prisma does.
 *
 * SECURITY RULE these all follow: never trust a role or id from the client.
 * Every function here re-derives the session from the server-side cookie via
 * requireAuth(), then checks OWNERSHIP against the database — never against
 * anything the browser sent.
 */

/**
 * Can this session view/act on the given client company's data?
 *
 * - ADMIN: always. Full platform access.
 * - PROJECT_MANAGER / TEAM_MEMBER: always. Per the platform's own docs,
 *   internal staff see operational details across clients — restricting
 *   staff to only their assigned projects is a finer-grained rule that
 *   belongs to the Projects module (Phase 5), not this baseline.
 * - CLIENT: only if this is literally their own client company. We look up
 *   the client record owned by their user id and compare — we never trust a
 *   clientId the caller passed in without checking it against the database.
 *
 * Throws "UNAUTHORIZED" (not logged in) or "FORBIDDEN" (logged in, wrong
 * client) — callers typically map both to a 404-style page so a client can't
 * even tell whether a given id belongs to someone else.
 */
export async function requireClientAccess(clientId: string): Promise<AuthSession> {
  const session = await requireAuth();

  if (session.role === "ADMIN" || session.role === "PROJECT_MANAGER" || session.role === "TEAM_MEMBER") {
    return session;
  }

  // session.role === "CLIENT" from here on.
  const ownClient = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!ownClient || ownClient.id !== clientId) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

/**
 * Can this session view/act on the given project? A project is scoped to
 * one client, so this delegates the actual decision to requireClientAccess()
 * — one rule, defined once, reused everywhere a project is loaded.
 *
 * Returns the project too, so callers that were going to fetch it anyway
 * don't need a second round trip.
 */
export async function requireProjectAccess(
  projectId: string
): Promise<{ session: AuthSession; project: Project }> {
  // Must be logged in before we even reveal whether the project exists.
  await requireAuth();

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error("NOT_FOUND");
  }

  const session = await requireClientAccess(project.clientId);
  return { session, project };
}

/**
 * Can this session MANAGE (create/edit/reassign/change status of) the given
 * project — as opposed to merely VIEW it (that's requireProjectAccess above,
 * used by the client portal and by any staff member browsing project info).
 *
 * - ADMIN: always. Full authority over every project.
 * - PROJECT_MANAGER: only if they are ALREADY this project's manager, or the
 *   project has no manager yet (so someone can claim it). This is the
 *   "authorized project managers" distinction from an unrestricted "any PM
 *   can edit any project" rule — deliberately narrower, and closes a gap
 *   this file's own comment flagged as deferred when requireClientAccess()
 *   was first written ("restricting staff to only their assigned projects
 *   is a finer-grained rule that belongs to the Projects module").
 * - TEAM_MEMBER / CLIENT: never. Task-level work only, not project
 *   management, and clients never modify project ownership or structure.
 *
 * Pure and synchronous on purpose — no database call, no throwing. Callers
 * that already have a project loaded (e.g. mid-page-render) can check
 * without a second round trip. requireProjectManagementAccess() below is
 * the version that loads the project itself and throws on failure.
 */
export function canManageProject(session: AuthSession, project: Pick<Project, "managerId">): boolean {
  if (session.role === "ADMIN") return true;
  if (session.role === "PROJECT_MANAGER") {
    return project.managerId === null || project.managerId === session.userId;
  }
  return false;
}

/**
 * Loads the project and enforces canManageProject() above. Use this at the
 * top of every project-management server action (update, assign manager,
 * assign client, change status) — independently of whatever page rendered
 * the button that called it, per this platform's standing rule that every
 * mutation re-checks authorization itself.
 *
 * Throws "NOT_FOUND" if the project doesn't exist, "FORBIDDEN" if it exists
 * but this session isn't authorized to manage it.
 */
export async function requireProjectManagementAccess(
  projectId: string
): Promise<{ session: AuthSession; project: Project }> {
  const session = await requireRole(["ADMIN", "PROJECT_MANAGER"]);

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error("NOT_FOUND");
  }

  if (!canManageProject(session, project)) {
    throw new Error("FORBIDDEN");
  }

  return { session, project };
}

/**
 * Can this session MANAGE (create/edit/delete) tasks belonging to the given
 * project? Same rule as canManageProject() — a task is scoped to one
 * project, so task authority follows project authority rather than
 * introducing a separate, parallel rule:
 *
 * - ADMIN: always.
 * - PROJECT_MANAGER: only if they manage this task's project (or it has no
 *   manager yet).
 * - TEAM_MEMBER / CLIENT: never — task management (create/edit/delete) is
 *   distinct from being assigned a task to work on.
 */
export function canManageTask(session: AuthSession, project: Pick<Project, "managerId">): boolean {
  return canManageProject(session, project);
}

/**
 * Loads the task (with its project) and enforces canManageTask() above. Use
 * this at the top of every task server action, independent of whatever page
 * rendered the control that called it — same standing rule as
 * requireProjectManagementAccess().
 *
 * Throws "NOT_FOUND" if the task doesn't exist, "FORBIDDEN" if it exists but
 * this session isn't authorized to manage it.
 */
export async function requireTaskManagementAccess(
  taskId: string
): Promise<{ session: AuthSession; task: Task & { project: Project } }> {
  const session = await requireRole(["ADMIN", "PROJECT_MANAGER"]);

  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
  if (!task) {
    throw new Error("NOT_FOUND");
  }

  if (!canManageTask(session, task.project)) {
    throw new Error("FORBIDDEN");
  }

  return { session, task };
}
