import { cn } from "@/lib/utils";

/**
 * One shared color map for every status/priority value across the app
 * (LeadStatus, ProjectStatus, TaskStatus, ClientStatus, Priority,
 * AutomationRunStatus). Centralized here so "QUALIFIED" or "FAILED" always
 * means the same color everywhere a badge appears, instead of each page
 * inventing its own palette.
 */
const TONE_MAP: Record<string, string> = {
  // neutral / early-stage
  NEW: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  TODO: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  PLANNING: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  PENDING: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  LOW: "bg-slate-500/10 text-slate-300 border-slate-500/20",

  // in progress
  CONTACTED: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  IN_PROGRESS: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  ACTIVE: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  RUNNING: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  PROPOSAL: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  REVIEW: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-300 border-amber-500/20",

  // positive / success
  QUALIFIED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  WON: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  SUCCESS: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  DONE: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",

  // caution
  HIGH: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  ON_HOLD: "bg-orange-500/10 text-orange-300 border-orange-500/20",

  // negative
  LOST: "bg-red-500/10 text-red-300 border-red-500/20",
  CANCELLED: "bg-red-500/10 text-red-300 border-red-500/20",
  FAILED: "bg-red-500/10 text-red-300 border-red-500/20",
  URGENT: "bg-red-500/10 text-red-300 border-red-500/20",
  SUSPENDED: "bg-red-500/10 text-red-300 border-red-500/20",
  INACTIVE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  ARCHIVED: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

const DEFAULT_TONE = "bg-slate-500/10 text-slate-300 border-slate-500/20";

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
