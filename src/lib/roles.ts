import type { Role } from "@prisma/client";

/**
 * Deliberately has ZERO Next.js-specific imports (no next/headers, no
 * Prisma client instance) so it is safe to import from middleware.ts, which
 * runs on the Edge runtime — unlike auth.ts (uses next/headers) and
 * authorization.ts (uses the Prisma client), neither of which are
 * Edge-compatible.
 */

/** Where a logged-in user of each role lands after login. */
export function roleHomePath(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "PROJECT_MANAGER":
    case "TEAM_MEMBER":
      return "/manager";
    case "CLIENT":
      return "/client";
  }
}

/**
 * Coarse, path-prefix-based role gate used by middleware.ts as a first line
 * of defense (redirects obviously-wrong-role visitors before a page even
 * renders). This is a UX convenience, NOT the real security boundary — see
 * the big warning comment in middleware.ts. The actual enforcement is
 * requireRole()/requireClientAccess()/requireProjectAccess() called again
 * inside every protected page and route handler.
 */
export const ROUTE_ROLE_MAP: Array<{ prefix: string; roles: Role[] }> = [
  // More specific rule listed BEFORE the general "/admin" rule — middleware
  // matches with .find(), which takes the first match, so this carve-out
  // wins for /admin/projects* without opening up the rest of /admin/* (leads,
  // audit logs, settings, etc.) to PROJECT_MANAGER. Project management is
  // the one admin module project managers are authorized to reach; the
  // per-project "are they actually authorized for THIS project" check still
  // happens server-side in requireProjectManagementAccess() (src/lib/
  // authorization.ts) — this only gets a PM as far as the route.
  { prefix: "/admin/projects", roles: ["ADMIN", "PROJECT_MANAGER"] },
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/manager", roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"] },
  { prefix: "/client", roles: ["CLIENT"] },
];
