"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AlertTriangle } from "lucide-react";

/**
 * Catches unexpected errors thrown while rendering a page.
 *
 * SECURITY NOTE: we deliberately show a generic message. Raw error text can
 * leak database structure, file paths or secrets. The real error goes to the
 * server logs instead, where only you can see it.
 *
 * This must be a client component — that is a Next.js requirement.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, send this to a monitoring service (Phase 10).
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <AlertTriangle
          className="mx-auto mb-4 h-10 w-10 text-amber-400"
          aria-hidden="true"
        />
        <h1 className="mb-2 text-xl font-semibold text-slate-100">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-slate-400">
          We hit an unexpected problem. Please try again — if it keeps
          happening, contact support.
        </p>
        {/* `reset` re-renders the page without a full browser reload. */}
        <Button onClick={() => reset()}>Try again</Button>
        {error.digest && (
          <p className="mt-4 text-xs text-slate-600">
            Reference: {error.digest}
          </p>
        )}
      </Card>
    </div>
  );
}
