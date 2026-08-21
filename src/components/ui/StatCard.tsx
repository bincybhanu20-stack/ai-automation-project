import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  /** "warning" tints the icon/value for numbers that need attention, e.g. overdue tasks. */
  tone?: "default" | "warning";
}

export function StatCard({ label, value, icon: Icon, href, tone = "default" }: StatCardProps) {
  const content = (
    <Card hoverable={Boolean(href)} className="h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p
            className={cn(
              "mt-1 text-3xl font-bold",
              tone === "warning" && value > 0 ? "text-amber-400" : "text-slate-100"
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            tone === "warning" && value > 0 ? "bg-amber-500/10" : "bg-sky-500/10"
          )}
        >
          <Icon
            className={cn("h-4 w-4", tone === "warning" && value > 0 ? "text-amber-400" : "text-sky-400")}
            aria-hidden="true"
          />
        </div>
      </div>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
