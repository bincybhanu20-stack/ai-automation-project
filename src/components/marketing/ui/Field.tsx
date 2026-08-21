import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface PublicFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/**
 * Mirrors components/ui/FormField.tsx's prop shape exactly (same `label` +
 * standard input attributes) so LeadCaptureForm's restyle is a pure import
 * swap — no state, validation or event-handling logic changes at all.
 */
export function PublicField({ label, id, className, ...props }: PublicFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal-dark">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "w-full rounded-lg border border-hairline bg-white px-3.5 py-2.5 text-sm text-charcoal-dark placeholder:text-charcoal-muted pub-focus",
          className
        )}
        {...props}
      />
    </div>
  );
}
