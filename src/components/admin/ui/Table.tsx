import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Admin's light-theme table primitives — mirrors components/ui/Table.tsx's
 * composable shape exactly (Table/Thead/Tbody/Tr/Th/Td). */

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-hairline">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-hairline bg-surface text-xs uppercase tracking-wider text-charcoal-muted">
      {children}
    </thead>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-hairline">{children}</tbody>;
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("hover:bg-surface", className)}>{children}</tr>;
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("whitespace-nowrap px-4 py-3 font-medium", className)}>{children}</th>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 text-charcoal", className)}>{children}</td>;
}
