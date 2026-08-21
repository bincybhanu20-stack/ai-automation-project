import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  /** "wide" for dashboards, "default" for marketing pages, "narrow" for forms. */
  size?: "narrow" | "default" | "wide";
}

const sizeStyles = {
  narrow: "max-w-2xl",
  default: "max-w-5xl",
  wide: "max-w-7xl",
};

/**
 * Centres content and applies consistent horizontal padding on every screen
 * size. Using this everywhere is what keeps the layout responsive.
 */
export function Container({
  children,
  className,
  size = "default",
}: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeStyles[size], className)}>
      {children}
    </div>
  );
}
