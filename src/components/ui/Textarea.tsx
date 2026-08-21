import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

/** Labeled multi-line input matching the app's glass-input style. */
export function TextareaField({ label, id, className, ...props }: TextareaFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <textarea
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
