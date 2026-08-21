import { cache } from "react";
import { requireRoleForPage } from "./page-guards";
import type { AuthSession } from "./auth";

/**
 * Every /admin/* page calls this — from BOTH generateMetadata() and the
 * page body. Wrapped in cache() so that within one request it only runs
 * requireRoleForPage() once, regardless of how many times it's called.
 *
 * WHY generateMetadata() too: Next.js awaits generateMetadata() before it
 * starts streaming the page body. Calling redirect() from there sets the
 * correct HTTP status (307) before any response bytes are sent. Calling it
 * only from deep inside the page body works correctly for the CONTENT (a
 * non-admin never sees the page), but every /admin/* route sits under
 * src/app/admin/loading.tsx's Suspense boundary — so Next.js may have
 * already flushed a 200 status before that later redirect() call resolves.
 * This exact bug (for notFound(), not redirect(), but the same underlying
 * cause) was found and fixed during the authentication phase; this pattern
 * prevents it from recurring across the ~10 new admin pages in this phase.
 *
 * ADMIN only — this is deliberately narrower than /manager (which also
 * allows PROJECT_MANAGER and TEAM_MEMBER). Matches the existing
 * middleware.ts route map (src/lib/roles.ts), which already restricts
 * /admin/* to ADMIN alone.
 */
export const requireAdmin = cache(async (): Promise<AuthSession> => {
  return requireRoleForPage(["ADMIN"]);
});

/**
 * For the project management pages specifically (/admin/projects/*), which
 * — unlike every other /admin/* page — are also open to PROJECT_MANAGER,
 * matching the middleware carve-out in src/lib/roles.ts. This only confirms
 * "is this session staff with project access at all" (a page-level gate);
 * WHICH specific projects a PROJECT_MANAGER may edit is a separate, finer
 * check done by requireProjectManagementAccess() (src/lib/authorization.ts)
 * on every mutation.
 */
export const requireProjectStaff = cache(async (): Promise<AuthSession> => {
  return requireRoleForPage(["ADMIN", "PROJECT_MANAGER"]);
});
