import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

interface PublicAlertProps {
  variant: "error" | "success";
  children: ReactNode;
}

export function PublicAlert({ variant, children }: PublicAlertProps) {
  const Icon = variant === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm",
        variant === "error"
          ? "border-crimson/30 bg-crimson-light text-crimson-hover"
          : "border-emerald-300 bg-emerald-50 text-emerald-700"
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
