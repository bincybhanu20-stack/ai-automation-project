import { Loader2 } from "lucide-react";

/**
 * Shown automatically by Next.js while a page's server data is loading.
 * Having this file means users never stare at a blank screen.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-sky-400"
          aria-hidden="true"
        />
        <p className="text-sm text-slate-400">Loading…</p>
        {/* Announced to screen readers, invisible on screen. */}
        <span className="sr-only" role="status">
          Loading content
        </span>
      </div>
    </div>
  );
}
