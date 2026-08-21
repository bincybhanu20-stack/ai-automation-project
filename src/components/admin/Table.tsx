import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Small composable table primitives rather than one generic <DataTable
 * columns={} data={} /> — every admin list page has different columns and
 * different per-row actions, so a render-prop-heavy generic component would
 * fight TypeScript more than it would save. These wrap plain <table>
 * elements with the app's consistent styling; each page composes them.
 */

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-500">
      {children}
    </thead>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-white/5">{children}</tbody>;
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("hover:bg-white/[0.02]", className)}>{children}</tr>;
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("whitespace-nowrap px-4 py-3 font-medium", className)}>{children}</th>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 text-slate-300", className)}>{children}</td>;
}
