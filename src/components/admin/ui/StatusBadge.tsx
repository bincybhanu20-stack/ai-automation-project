import { cn } from "@/lib/utils";

/**
 * Light-theme version of components/ui/StatusBadge.tsx's shared color map —
 * same status keys and semantic hues (sky/indigo/violet/amber/emerald/
 * orange/red/slate), re-tuned to light-mode-appropriate tints instead of
 * dark translucent fills, so it stays legible on the admin panel's white
 * background.
 */
const TONE_MAP: Record<string, string> = {
  // neutral / early-stage
  NEW: "bg-sky-50 text-sky-700 border-sky-200",
  TODO: "bg-slate-100 text-slate-600 border-slate-200",
  PLANNING: "bg-slate-100 text-slate-600 border-slate-200",
  PENDING: "bg-slate-100 text-slate-600 border-slate-200",
  LOW: "bg-slate-100 text-slate-600 border-slate-200",

  // in progress
  CONTACTED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ACTIVE: "bg-indigo-50 text-indigo-700 border-indigo-200",
  RUNNING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PROPOSAL: "bg-violet-50 text-violet-700 border-violet-200",
  REVIEW: "bg-violet-50 text-violet-700 border-violet-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",

  // positive / success
  QUALIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  WON: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DONE: "bg-emerald-50 text-emerald-700 border-emerald-200",

  // caution
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  ON_HOLD: "bg-orange-50 text-orange-700 border-orange-200",

  // negative
  LOST: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  URGENT: "bg-red-50 text-red-700 border-red-200",
  SUSPENDED: "bg-red-50 text-red-700 border-red-200",
  INACTIVE: "bg-slate-100 text-slate-500 border-slate-200",
  ARCHIVED: "bg-slate-100 text-slate-500 border-slate-200",
};

const DEFAULT_TONE = "bg-slate-100 text-slate-600 border-slate-200";

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_MAP[value] ?? DEFAULT_TONE
      )}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}
