import { Loader2 } from "lucide-react";

/**
 * Scoped to /admin only — NOT a global loading.tsx.
 *
 * A root-level loading.tsx used to wrap every route (including
 * /portal/projects/[id]) in an implicit Suspense boundary. That caused
 * Next.js to flush an HTTP 200 status immediately, before an async page
 * could call notFound()/redirect() — so a blocked cross-client project
 * request returned status 200 with 404 content instead of a real 404 (the
 * content was always correct and never leaked data, but the status code
 * was wrong). Scoping loading.tsx per-route, and only on routes that never
 * call notFound()/redirect() based on data (like this dashboard), avoids
 * that problem entirely. See src/lib/page-guards.ts for the full story.
 */
export default function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-sky-400" aria-hidden="true" />
    </div>
  );
}
