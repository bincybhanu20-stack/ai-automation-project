import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SearchX } from "lucide-react";

/** Shown for any URL that doesn't match a page. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <SearchX
          className="mx-auto mb-4 h-10 w-10 text-slate-500"
          aria-hidden="true"
        />
        <h1 className="mb-2 text-xl font-semibold text-slate-100">
          Page not found
        </h1>
        <p className="mb-6 text-sm text-slate-400">
          The page you were looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/"
          className="gradient-button inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to home
        </Link>
      </Card>
    </div>
  );
}
