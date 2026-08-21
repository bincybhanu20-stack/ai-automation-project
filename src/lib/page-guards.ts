import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import type { Role } from "@prisma/client";
import { requireRole, type AuthSession } from "./auth";
import { requireProjectAccess } from "./authorization";
import type { Project } from "@prisma/client";

/**
 * Wraps requireRole() for use directly inside a page component: instead of
 * throwing (which would hit the generic error boundary — a confusing "500"
 * page for what is really "please log in"), it redirects to the right place.
 *
 * Note: middleware.ts already redirects most of these cases before the page
 * even renders. This second check is not redundant — it's the actual
 * enforcement. Middleware is a UX convenience; this is the real guard.
 */
export async function requireRoleForPage(roles: Role[]): Promise<AuthSession> {
  try {
    return await requireRole(roles);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    redirect("/unauthorized");
  }
}

/**
 * Wraps requireProjectAccess() for use inside a page. FORBIDDEN and
 * NOT_FOUND are both rendered as a plain 404 — deliberately indistinguishable
 * — so a client probing another client's project id can't learn whether
 * that id exists at all, only that they can't see it.
 *
 * Wrapped in React's cache() so calling it from BOTH generateMetadata() and
 * the page body (see src/app/client/projects/[id]/page.tsx) only runs the
 * actual database query once per request — cache() dedupes by arguments
 * within a single render pass.
 *
 * WHY generateMetadata() ALSO calls this: Next.js awaits generateMetadata()
 * before it starts streaming the page body. Calling notFound()/redirect()
 * from there sets the correct HTTP status (404/307) before any response
 * bytes are sent. Calling it only from deep inside the page body works
 * correctly for the CONTENT (the wrong client never sees the data — verified
 * independently), but because this page sits under a Suspense boundary
 * (from the global loading.tsx), Next.js may already have flushed a 200
 * status before that later notFound() call resolves, and an HTTP status
 * line can't be un-sent once flushed. Doing the check in both places is the
 * pattern Next.js's own docs recommend for exactly this situation.
 */
export const requireProjectAccessForPage = cache(async function requireProjectAccessForPage(
  projectId: string
): Promise<{ session: AuthSession; project: Project }> {
  try {
    return await requireProjectAccess(projectId);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    notFound();
  }
});
