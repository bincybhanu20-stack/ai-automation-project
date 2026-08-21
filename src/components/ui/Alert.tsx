import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

interface AlertProps {
  variant: "error" | "success";
  children: ReactNode;
}

/** Inline banner for form-level errors and success messages. */
export function Alert({ variant, children }: AlertProps) {
  const Icon = variant === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm",
        variant === "error"
          ? "border-red-500/30 bg-red-500/10 text-red-300"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
