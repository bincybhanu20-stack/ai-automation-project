/**
 * One color per admin module, so each section of the sidebar/dashboard
 * reads as visually distinct at a glance instead of every page looking
 * identically crimson-on-white. Crimson stays reserved for primary actions
 * (buttons, "Add X" links) — this map is for module IDENTITY accents only
 * (sidebar active state, stat-card icons), never for buttons.
 *
 * Written as a static Record of full literal Tailwind class strings —
 * required so Tailwind's content scanner can find them (it can't see
 * classes assembled at runtime via string interpolation, e.g. `bg-${x}-50`
 * — see StatusBadge.tsx's TONE_MAP for the same pattern already
 * established in this codebase).
 */
export type ModuleColor =
  | "crimson"
  | "sky"
  | "emerald"
  | "violet"
  | "amber"
  | "teal"
  | "indigo"
  | "rose"
  | "cyan"
  | "slate";

interface AccentClasses {
  /** Sidebar active nav item / light icon-box background. */
  bg: string;
  /** Icon / active nav item text color. */
  text: string;
  /** Solid fill — progress bars, chart bars — where a light tint wouldn't
   * read as filled. */
  bar: string;
}

export const MODULE_ACCENTS: Record<ModuleColor, AccentClasses> = {
  crimson: { bg: "bg-crimson-light", text: "text-crimson", bar: "bg-crimson" },
  sky: { bg: "bg-sky-50", text: "text-sky-600", bar: "bg-sky-500" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", bar: "bg-emerald-500" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", bar: "bg-violet-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", bar: "bg-amber-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", bar: "bg-teal-500" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", bar: "bg-indigo-500" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", bar: "bg-rose-500" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-600", bar: "bg-cyan-500" },
  slate: { bg: "bg-slate-100", text: "text-slate-600", bar: "bg-slate-500" },
};

/** Which color each admin module gets — the single place to change if a
 * module's identity color needs to move. */
export const MODULE_COLOR: Record<string, ModuleColor> = {
  dashboard: "crimson",
  leads: "sky",
  clients: "emerald",
  projects: "violet",
  tasks: "amber",
  users: "teal",
  notifications: "indigo",
  reports: "rose",
  automations: "cyan",
  auditLogs: "slate",
  settings: "slate",
};
