import Link from "next/link";
import { Card } from "./Card";
import { cn } from "@/lib/utils";
import { MODULE_ACCENTS, type ModuleColor } from "@/lib/admin-module-colors";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  /** "warning" tints the icon/value amber for numbers that need attention
   * (e.g. overdue tasks) — this always wins over `accent`, since "needs
   * attention" is a more urgent signal than plain module identity. */
  tone?: "default" | "warning";
  /** Which module this stat belongs to (Leads, Projects, Tasks, ...) — see
   * src/lib/admin-module-colors.ts. Defaults to crimson for stats that
   * aren't tied to one specific module. */
  accent?: ModuleColor;
}

/** Admin's light-theme stat tile — mirrors components/ui/StatCard.tsx's
 * prop shape exactly, built on this folder's own light Card. */
export function StatCard({ label, value, icon: Icon, href, tone = "default", accent = "crimson" }: StatCardProps) {
  const warning = tone === "warning" && value > 0;
  const colors = warning ? MODULE_ACCENTS.amber : MODULE_ACCENTS[accent];

  const content = (
    <Card hoverable={Boolean(href)} className="h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-charcoal-muted">{label}</p>
          <p className={cn("mt-1 text-3xl font-bold", warning ? "text-amber-600" : "text-charcoal-dark")}>
            {value}
          </p>
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", colors.bg)}>
          <Icon className={cn("h-4 w-4", colors.text)} aria-hidden="true" />
        </div>
      </div>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
