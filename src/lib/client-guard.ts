import { cache } from "react";
import { requireRoleForPage } from "./page-guards";
import type { AuthSession } from "./auth";

/**
 * Every /client/* page calls this — from BOTH generateMetadata() and the
 * page body. Same reasoning as requireAdmin() (src/lib/admin-guard.ts):
 * wrapped in cache() so it only runs once per request, and called from
 * generateMetadata specifically so an unauthorized visitor gets a correct
 * HTTP status before any content streams — see admin-guard.ts's comment
 * for the full story of why this matters.
 */
export const requireClient = cache(async (): Promise<AuthSession> => {
  return requireRoleForPage(["CLIENT"]);
});
