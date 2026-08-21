import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/** Admin's light-theme labeled input — mirrors components/ui/FormField.tsx's
 * prop shape exactly. */
export function FormField({ label, id, className, ...props }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal-dark">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "w-full rounded-lg border border-hairline bg-white px-3.5 py-2.5 text-sm text-charcoal-dark placeholder:text-charcoal-muted focus:outline-none focus:ring-2 focus:ring-crimson/40 focus:border-crimson",
          className
        )}
        {...props}
      />
    </div>
  );
}
