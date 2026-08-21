import { Loader2 } from "lucide-react";

// Scoped to /admin only (not a root-level loading.tsx) so /client and the
// public site never mount this — Next.js file-convention loading UIs apply
// to their own segment and everything nested under it. Every /admin/* page
// gets this Suspense fallback for free, including the auth redirect timing
// described in src/lib/admin-guard.ts's comment.
export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-crimson" aria-hidden="true" />
    </div>
  );
}
