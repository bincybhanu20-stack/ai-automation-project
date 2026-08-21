import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Adds a subtle lift on hover. Use for clickable cards. */
  hoverable?: boolean;
}

/**
 * Admin dashboard's light-theme card — mirrors components/ui/Card.tsx's
 * prop shape exactly, but white/bordered instead of dark glass, so admin
 * pages can restyle by swapping the import only. Kept separate from
 * components/ui/Card (shared with the client portal, which stays dark) so
 * this re-theme can't leak outside /admin.
 */
export function Card({ children, className, hoverable = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-hairline bg-white p-6 shadow-sm",
        hoverable && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-charcoal-dark">{title}</h3>
        {description && <p className="mt-1 text-sm text-charcoal-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
