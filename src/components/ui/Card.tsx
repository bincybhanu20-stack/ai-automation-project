import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Adds a subtle lift + glow on hover. Use for clickable cards. */
  hoverable?: boolean;
}

/**
 * Frosted-glass panel. This is the main surface for dashboard widgets,
 * forms and list items.
 */
export function Card({ children, className, hoverable = false }: CardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl p-6",
        hoverable && "glass-card-hover",
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
  /** Optional element pinned to the right, e.g. a button or badge. */
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
