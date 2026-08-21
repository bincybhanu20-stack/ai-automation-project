import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

/** Admin's light-theme "nothing here" state — mirrors
 * components/ui/EmptyState.tsx's prop shape exactly. */
export function EmptyState({ icon: Icon = Inbox, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline px-6 py-16 text-center">
      <Icon className="mb-3 h-8 w-8 text-charcoal-muted" aria-hidden="true" />
      <p className="text-sm font-medium text-charcoal-dark">{title}</p>
      {description && <p className="mt-1 text-sm text-charcoal-muted">{description}</p>}
    </div>
  );
}
