import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PublicCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function PublicCard({ children, className, hoverable = false }: PublicCardProps) {
  return (
    <div
      className={cn(
        "pub-card rounded-2xl p-6",
        hoverable && "pub-card-hover cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
