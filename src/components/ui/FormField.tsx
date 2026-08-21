import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/** Labeled text input matching the app's glass-input style. */
export function FormField({ label, id, className, ...props }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "glass-input w-full rounded-lg px-3.5 py-2.5 text-sm",
          className
        )}
        {...props}
      />
    </div>
  );
}
