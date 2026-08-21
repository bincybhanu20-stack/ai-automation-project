import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
}

/** Admin's light-theme progress bar — mirrors
 * components/ui/ProgressBar.tsx's prop shape exactly. */
export function ProgressBar({ value, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 overflow-hidden rounded-full bg-surface", className)}
    >
      <div className="h-full rounded-full bg-crimson transition-all" style={{ width: `${clamped}%` }} />
    </div>
  );
}
