import { prisma } from "./prisma";
import { requireAuth, type AuthSession } from "./auth";
import type { Project } from "@prisma/client";

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
