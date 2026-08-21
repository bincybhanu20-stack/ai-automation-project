import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * `cn` = "class names".
 *
 * It lets you combine Tailwind classes safely, including conditional ones:
 *
 *   cn("p-4 text-sm", isActive && "text-sky-400")
 *
 * It also resolves conflicts intelligently. `cn("p-2", "p-4")` returns "p-4"
 * (the last one wins) instead of leaving both classes fighting each other.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for display, e.g. "21 Aug 2026".
 * Returns an em dash for missing dates so the UI never shows "null".
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
