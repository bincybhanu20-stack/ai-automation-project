import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

/** Reusable "nothing here" state for every admin list page — distinct from
 * loading and error states, and from each other (e.g. "no leads yet" vs
 * "no leads match these filters"), per caller-provided copy. */
export function EmptyState({ icon: Icon = Inbox, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-6 py-16 text-center">
      <Icon className="mb-3 h-8 w-8 text-slate-600" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}
