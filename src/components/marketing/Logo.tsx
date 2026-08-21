import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Use on dark backgrounds (e.g. the footer) — swaps the wordmark to white. */
  inverted?: boolean;
}

/**
 * Elicpesoftware's brand mark: a geometric "E" monogram built from three
 * stacked bars in the primary red, plus the wordmark.
 *
 * No image file — this is inline SVG + text, so it's infinitely crisp at
 * any size, needs no separate asset pipeline, and themes with plain CSS
 * (the `inverted` prop) instead of shipping two PNG variants.
 */
export function Logo({ className, inverted = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="2" y="2" width="24" height="24" rx="6" fill="#2E2C2B" />
        <rect x="8" y="8" width="12" height="2.8" rx="1.4" fill="#DE0000" />
        <rect x="8" y="12.6" width="8.5" height="2.8" rx="1.4" fill="#DE0000" />
        <rect x="8" y="17.2" width="12" height="2.8" rx="1.4" fill="#DE0000" />
      </svg>
      <span
        className={cn(
          "font-jakarta text-lg font-bold tracking-tight",
          inverted ? "text-white" : "text-charcoal-dark"
        )}
      >
        Elicpesoftware
      </span>
    </span>
  );
}
