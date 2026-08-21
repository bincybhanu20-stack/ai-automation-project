import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

/** Admin's light-theme pager — mirrors components/ui/Pagination.tsx's prop
 * shape exactly. */
export function Pagination({ currentPage, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
      <p className="text-xs text-charcoal-muted">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        <PageLink href={buildHref(currentPage - 1)} disabled={prevDisabled} label="Previous">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </PageLink>
        <PageLink href={buildHref(currentPage + 1)} disabled={nextDisabled} label="Next">
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-hairline px-3 py-1.5 text-sm text-charcoal-muted/60"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-hairline px-3 py-1.5 text-sm text-charcoal hover:bg-surface"
      )}
    >
      {children}
    </Link>
  );
}
